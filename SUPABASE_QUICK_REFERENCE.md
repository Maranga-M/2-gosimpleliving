# Supabase Integration - Quick Reference

## Quick Setup

```bash
# 1. Run SQL scripts in order (in Supabase SQL Editor)
STEP1_create_tables.sql
STEP2_enable_storage.sql
STEP3_enable_rls_policies.sql
FIX_AUTH_V2.sql  # Only if needed
```

## Authentication

### Sign In
```typescript
import { dbService } from '@/services/database';

const user = await dbService.signIn('user@example.com', 'password');
```

### Sign Up
```typescript
const user = await dbService.signUp('user@example.com', 'password', 'John Doe');
// User role defaults to 'user', created in profiles table automatically
```

### Sign Out
```typescript
await dbService.signOut();
// User automatically logged out, auth listener triggers UI update
```

### Listen for Auth Changes (Automatic in useAuth hook)
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, isLoading } = useAuth();
// user is null when logged out
// isLoading shows whether auth check is complete
```

## Database Operations

### Create Product (Editor/Admin Only)
```typescript
import { dbService } from '@/services/database';

const product: Product = {
  id: `p-${Date.now()}`,
  title: 'Gaming Laptop',
  price: 1299.99,
  // ... other fields
};

try {
  await dbService.createProduct(product);
} catch (error) {
  if (error.isRLSViolation) {
    // User is not an editor/admin
    console.error('Permission denied');
  } else if (error.isSessionExpired) {
    // Session invalid - logout happens automatically
    console.error('Session expired');
  }
}
```

### Update Product (Editor/Admin Only)
```typescript
const updatedProduct = { ...product, price: 999.99 };
await dbService.updateProduct(updatedProduct);
```

### Delete Product (Editor/Admin Only)
```typescript
await dbService.deleteProduct(productId);
```

### Get Products (Everyone)
```typescript
const products = await dbService.getProducts();
```

### Update Site Content (Admin Only)
```typescript
await dbService.saveSiteContent({
  heroTitle: 'New Title',
  categories: ['Electronics', 'Home'],
  // ... other config
});
```

## Error Handling

### Detect Error Type
```typescript
import { isRLSViolationError, isSessionExpiredError } from '@/services/database';

try {
  await dbService.createProduct(product);
} catch (error) {
  if (isRLSViolationError(error)) {
    // Handle permission denied
    toast.error('You don\'t have permission to do this');
  } else if (isSessionExpiredError(error)) {
    // Handle session expired
    // App automatically logs out and redirects
    toast.error('Please log in again');
  } else {
    // Handle other database errors
    toast.error('Database error: ' + error.message);
  }
}
```

## User Roles and Permissions

### User Roles
- `'user'` - Can view products, posts, manage wishlist
- `'editor'` - Can create/edit/delete products and posts
- `'admin'` - Full access including site settings

### Check User Role
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user } = useAuth();

if (user?.role === 'editor' || user?.role === 'admin') {
  // Show edit buttons
}

if (user?.role === 'admin') {
  // Show site settings
}
```

### Change User Role (Admin Only)
```typescript
await dbService.updateUserRole(userId, 'editor');
```

## RLS Policies (What's Protected)

| Table | Operation | Who Can | How |
|-------|-----------|---------|-----|
| products | SELECT | Everyone | Public read |
| products | INSERT | Editors/Admins | Role check |
| products | UPDATE | Editors/Admins | Role check |
| products | DELETE | Editors/Admins | Role check |
| posts | SELECT | Everyone | Public read |
| posts | INSERT | Editors/Admins | Role check |
| posts | UPDATE | Editors/Admins | Role check |
| site_content | SELECT | Everyone | Public read |
| site_content | UPDATE | Admins Only | Role check |
| profiles | SELECT | Everyone | Public read |
| profiles | UPDATE | Owner or Admin | ID/Role check |
| analytics | INSERT | Everyone | No check (event tracking) |

## Session Persistence

The app automatically:
- Checks for existing session on page load (5-second timeout)
- Keeps users logged in across browser refresh
- Recovers session from browser storage
- Handles token expiration

**No action needed** - This is automatic via `useAuth` hook.

## Wishlist Management

### Add to Wishlist
```typescript
import { useAuth } from '@/hooks/useAuth';

const { toggleWishlist } = useAuth();

await toggleWishlist(productId);
```

### Get Wishlist
```typescript
const { user } = useAuth();
const wishlist = user?.wishlist || [];
```

## Analytics

### Track Event
```typescript
import { AnalyticsService } from '@/services/analytics';

AnalyticsService.trackProductClick(productId, productTitle, price);
```

## Debugging

### Enable Debug Logs
```typescript
// Supabase service already logs to console
// Check browser DevTools Console tab

// Look for logs like:
// "Supabase Auth Event: SIGNED_IN"
// "Supabase Service: testConnection END"
```

### Test RLS Policy
```typescript
// 1. Go to Supabase Dashboard
// 2. SQL Editor
// 3. Run test query as different roles

-- Test as authenticated user with 'editor' role:
SELECT * FROM profiles WHERE role = 'editor';

-- Test INSERT as non-editor:
INSERT INTO products (id, title, price) VALUES ('test', 'Test', 99.99);
-- Should fail with: "permission denied for schema public"
```

### Check Session
```typescript
// In browser console:
supabase.auth.getSession()
// Should return { data: { session: {...} } } when logged in
```

## Common Issues

### Issue: "Access Denied" error
**Solution**: 
- Check user role: `dbService.getAllUsers()`
- Verify RLS policy exists: See Supabase Dashboard > Policies
- Ensure STEP3 SQL was run

### Issue: User logs out after refresh
**Solution**:
- Check browser allows localStorage/sessionStorage
- Verify Supabase session persistence is enabled
- Check network tab for auth failures

### Issue: Can't create/edit products
**Solution**:
- Verify your role is 'editor' or 'admin'
- Run: `dbService.updateUserRole(yourId, 'editor')`
- Check error details in console

### Issue: "Column not found" errors
**Solution**:
- Ensure STEP1 SQL was run
- Check no columns have been removed
- Verify types.ts matches your database schema

## Testing Checklist

- [ ] Run all SQL scripts (STEP1, STEP2, STEP3)
- [ ] Sign up as new user → role should be 'user'
- [ ] Try to create product as 'user' → should fail with RLS error
- [ ] Change role to 'editor' → create product → should work
- [ ] Test product CRUD with editor account
- [ ] Log in with admin account → update site content
- [ ] Sign out → sign back in → session persists
- [ ] Wait for session to expire → auto-logout
- [ ] Check error messages are user-friendly (no SQL exposed)

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication Reference](https://supabase.com/docs/reference/javascript/auth-signin)
- [Realtime Docs](https://supabase.com/docs/guides/realtime)
