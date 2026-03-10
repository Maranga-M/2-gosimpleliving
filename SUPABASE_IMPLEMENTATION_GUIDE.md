# Supabase Integration Implementation Guide

This guide explains the complete Supabase setup with role-based access control, session persistence, and proper error handling.

## Overview

The system implements three user roles with specific permissions:
- **user**: Can read products/posts, manage wishlist, view site
- **editor**: Can create/edit/delete products and posts
- **admin**: Full access including site configuration and user management

## Setup Instructions

### Step 1: Create Tables
Run `/supabase/STEP1_create_tables.sql` in Supabase SQL Editor to create:
- `profiles` - User profiles with roles
- `products` - Product catalog
- `posts` - Blog posts
- `site_content` - Site configuration
- `analytics` - Event tracking

### Step 2: Enable Storage (Optional)
Run `/supabase/STEP2_enable_storage.sql` if you need file uploads.

### Step 3: Enable Role-Based RLS Policies
**IMPORTANT**: Run `/supabase/STEP3_enable_rls_policies.sql` to enable proper Row Level Security policies.

This implements:
- **Public Read Access**: Everyone can view products, posts, and site content
- **Editor Permissions**: Editors (role='editor' or 'admin') can create/update/delete products
- **Admin Only**: Only admins can update site configuration
- **User Privacy**: Users can only modify their own profiles

### Step 4: Run Auth Fix (If Needed)
If you encounter permission issues, run `/supabase/FIX_AUTH_V2.sql` to reset permissions.

## Database Schema

### profiles table
```sql
id (uuid, PRIMARY KEY)
email (text)
name (text)
role (text: 'user' | 'editor' | 'admin', DEFAULT 'user')
wishlist (text[])
```

### products table
```sql
id (text, PRIMARY KEY)
title (text, NOT NULL)
category (text)
price (numeric)
originalPrice (numeric)
rating (numeric)
reviews (numeric)
image (text)
description (text)
features (text[])
affiliateLink (text)
status (text: 'draft' | 'published', DEFAULT 'published')
clicks (numeric, DEFAULT 0)
isBestSeller (boolean, DEFAULT false)
created_at (timestamptz, DEFAULT now())
```

### sites_content table
```sql
id (text, PRIMARY KEY, DEFAULT 'main')
content (jsonb) - All site config stored as JSON
created_at (timestamptz)
updated_at (timestamptz)
```

## Frontend Features

### 1. Authentication Persistence

The app automatically:
- ✅ Checks for existing session on page load (with 5-second timeout)
- ✅ Keeps users logged in across browser refresh
- ✅ Listens for auth state changes in real-time
- ✅ Handles session expiration by redirecting to login

**Key Code**: `supabase/service.ts` - `authStateChanged()` function

### 2. Session Recovery Flow
```
Page Load
  ↓
Check for existing session (5s timeout)
  ↓
If valid session → Load user profile and role
  ↓
Set up real-time auth listener
  ↓
UI Ready with authenticated user
```

### 3. Error Handling

The system properly detects and handles:

#### RLS Violations (Permission Denied)
- User lacks role permission for action
- Example: Non-editor trying to create products
- Displays: "Access Denied: You don't have permission to..."
- User remains logged in, can try different action

#### Session Expiration
- Session token expired or invalid
- Automatic logout triggered
- User redirected to login page
- Clear message: "Your session has expired. Please log in again."

#### Database Errors
- Connection failures
- Schema mismatches
- Network timeouts
- Generic error message with retry option

## Implementation Details

### Role-Based Access Control (RLS Policies)

#### Products Table Example
```sql
-- Public can read
CREATE POLICY "Products: Public Read"
  ON public.products FOR SELECT
  USING (true);

-- Only editors/admins can insert
CREATE POLICY "Products: Editor Insert"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );
```

The `WITH CHECK` clause verifies:
1. User is authenticated (`auth.uid()`)
2. User exists in profiles table
3. User's role is 'editor' or 'admin'

All other operations (SELECT by non-editors, INSERT/UPDATE/DELETE by non-editors) automatically fail with RLS violation.

### Error Detection

The frontend detects error types:
```typescript
// RLS violation
if (error.message.includes('permission denied') || 
    error.code === 'PGRST301') {
  // User lacks role permission
  // Keep them logged in, show access denied message
}

// Session expired
if (error.message.includes('unauthorized') || 
    error.message.includes('expired')) {
  // Invalid session token
  // Log user out, redirect to login
}
```

## Usage Examples

### Create Product (Editor Only)
```typescript
const newProduct: Product = {
  id: `p-${Date.now()}`,
  title: 'New Product',
  price: 99.99,
  // ... other fields
};

try {
  await dbService.createProduct(newProduct);
  // Success - product saved
} catch (e) {
  if (e.isRLSViolation) {
    // User is not an editor
    toast.error('Only editors can create products');
  } else if (e.isSessionExpired) {
    // Session invalid - logout happens automatically
    toast.error('Session expired - please login again');
  }
}
```

### Update Site Content (Admin Only)
```typescript
try {
  await dbService.saveSiteContent({
    heroTitle: 'New Title',
    categories: ['Electronics', 'Home'],
    // ... other config
  });
} catch (e) {
  if (e.isRLSViolation) {
    // Only admins can update site content
    toast.error('Only administrators can change site settings');
  }
}
```

### Login and Auto-Recovery
```typescript
// On app load, automatically checks:
1. Is there a valid session in storage?
2. If yes → Fetch user profile with role
3. If no → Show login screen
4. All happens with 5-second timeout max
```

## Troubleshooting

### Issue: "Access Denied" when trying to edit products
**Solution**: 
- Verify user's role in `profiles` table
- Ensure RLS policy "Products: Editor Insert/Update" exists
- Check that `STEP3_enable_rls_policies.sql` was run

### Issue: Users get logged out after refresh
**Solution**:
- Check browser allows localStorage/cookies
- Verify Supabase session is being stored
- Check auth.getSession() in browser DevTools

### Issue: RLS policies not working
**Solution**:
1. Verify RLS is enabled: `ALTER TABLE products ENABLE ROW LEVEL SECURITY;`
2. Check policy exists: `SELECT * FROM pg_policies WHERE tablename = 'products';`
3. Test policy with SQL Editor in Supabase dashboard

### Issue: "localReviews" column not found
**Solution**: This column was removed. All references have been cleaned up in the codebase.

## Testing the Implementation

### Test User Roles
1. **Admin User**: `admin@demo.com` - Can do everything
2. **Editor User**: Create user with role='editor'
3. **Regular User**: Create user with role='user'

### Test RLS Policies
```typescript
// Test 1: Editor can create products
const editor = { role: 'editor' };
await createProduct(product); // ✅ Should work

// Test 2: User cannot create products
const user = { role: 'user' };
await createProduct(product); // ❌ Should fail with RLS error

// Test 3: Anyone can read products
await getProducts(); // ✅ Should work for all roles
```

### Test Session Persistence
1. Log in as a user
2. Refresh the page
3. User should remain logged in
4. Close browser, reopen, visit app
5. User should still be logged in
6. Wait for token to expire or explicitly log out
7. User should be redirected to login

## Security Checklist

- ✅ Only using Supabase `anon` key in frontend (no service role key)
- ✅ All data access protected by RLS policies
- ✅ Roles checked server-side via RLS, not client-side
- ✅ Session tokens stored securely (Supabase handles this)
- ✅ Password hashing handled by Supabase Auth
- ✅ No sensitive data exposed in error messages
- ✅ Session expiration triggers logout automatically
- ✅ Users cannot bypass RLS by modifying client code

## Next Steps

1. **Run all SQL scripts** in order (STEP1, STEP2, STEP3)
2. **Test authentication** - Sign up and log in
3. **Test role permissions** - Try creating products with different roles
4. **Monitor errors** - Check browser console for any issues
5. **Deploy** - When confident, deploy to production
