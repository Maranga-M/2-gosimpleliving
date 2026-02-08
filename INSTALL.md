
# GoSimpleLiving - Installation & Setup Guide

This guide will help you set up the **GoSimpleLiving** AI Affiliate Store locally, configure the backend with Supabase, and prepare it for deployment.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed on your computer:

*   A **Code Editor** (like VS Code).

---

## 2. Environment Variable Setup (Crucial!)

This app requires API keys for AI features and the database. You must create a file named `.env` in the root of your project folder to store these keys securely.

1.  Create a file named `.env` in the project's root directory.
2.  Copy the block below into your new `.env` file.
3.  Fill in the values for each key as described in the following sections.

```env
# -------------------------------------
# --- Google Gemini AI Configuration --
# -------------------------------------
VITE_API_KEY=your_gemini_api_key_here

# -------------------------------------
# --- Supabase Configuration
# -------------------------------------
VITE_SUPABASE_URL=https://qgeyubwcwusvqobbisyp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZXl1Yndjd3VzdnFvYmJpc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjM3MzgsImV4cCI6MjA4MDUzOTczOH0.viB1cGA4Nmv-Wy_iKoQw4IoSzNY1K_assLbOyRC6AwM
```

---

## 3. Google Gemini API Setup (AI Features)

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Click **Get API Key** and create a key.
3.  Add this key to your `.env` file for the `VITE_API_KEY` variable.

---

## 4. Backend Setup (Supabase)

The app is pre-configured to use **Supabase**.

1.  Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2.  Click **New project** and create one.
3.  Navigate to **Project Settings > API**.
4.  Find your **Project URL** and **Project API Keys** (use the `anon` `public` key).
5.  Add these to your `.env` file. The URL should match the one provided, and you must add your own anon key.
6.  Go to **SQL Editor** in the dashboard, click "New Query", and run the setup script from the **Setup Page** in the app to create your tables.
7.  Go to **Storage** in the dashboard, create a **New bucket** named `media-assets`, and make sure it is a **Public** bucket.

---

## 5. Setting Up Admin Access

The app separates users into `user`, `editor`, and `admin` roles.

1.  Run the app.
2.  Click **Sign In** and switch to "Create Account".
3.  Sign up with the email: `admin@demo.com` (Password: anything you want).
4.  The system will automatically assign the `admin` role to this user, giving you access to the dashboard.

---

## 6. Running The App

Follow your development environment's instructions to run the application. Once running, you can access it in your browser.

---

## 7. Google Authentication Setup (Important)

To make "Sign in with Google" work, you must configure Google Cloud Console:

1.  Enable **Google** as a provider in your Supabase Dashboard (Authentication > Providers).
2.  In the Supabase Google Provider settings, copy the **Callback URL (for OAuth)**. It looks like: `https://your-project.supabase.co/auth/v1/callback`.
3.  Go to your [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
4.  Find the **OAuth 2.0 Client ID** you created for this project.
5.  Under **Authorized redirect URIs**, click **Add URI** and paste the Supabase Callback URL you copied in step 2.
6.  Click **Save**. It may take 5 minutes to propagate.