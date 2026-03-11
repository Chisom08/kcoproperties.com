# Stripe "Secret Key Not Configured" Error - Quick Fix

## Problem
You're seeing the error: **"Stripe secret key not configured"** when clicking the payment button.

## Solution

### Step 1: Verify .env File Exists
Your `.env` file should be in the project root: `d:\kco-monorepo\kco-properties\.env`

### Step 2: Check STRIPE_SECRET_KEY is Set
Open your `.env` file and verify it contains:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
```

**Important:** 
- The key must be on a **single line** (no line breaks)
- No spaces around the `=` sign
- The key should start with `sk_test_` (for development) or `sk_live_` (for production)

### Step 3: Restart Your Development Server

The server needs to be restarted to load environment variables from `.env`:

1. **Stop the current server:**
   - Press `Ctrl+C` in the terminal where the server is running
   - Or close the terminal/process

2. **Start the server again:**
   ```bash
   pnpm dev
   ```

3. **Try the payment button again**

### Step 4: Verify Environment Variable is Loaded

After restarting, you can verify the key is loaded by checking the server logs. The server should start without errors.

## Common Issues

### Issue 1: Server Not Restarted
**Symptom:** Key is in `.env` but error persists
**Fix:** Restart the development server

### Issue 2: Key Has Line Breaks
**Symptom:** Key appears split across multiple lines
**Fix:** Ensure the entire key is on one line in `.env`

### Issue 3: Extra Spaces
**Symptom:** Key has spaces like `STRIPE_SECRET_KEY = sk_test_...`
**Fix:** Remove spaces: `STRIPE_SECRET_KEY=sk_test_...`

### Issue 4: Wrong File Location
**Symptom:** `.env` file is in wrong directory
**Fix:** Ensure `.env` is in the project root: `d:\kco-monorepo\kco-properties\.env`

### Issue 5: Using Test Key in Production
**Symptom:** Using `sk_test_` key in production environment
**Fix:** Use `sk_live_` key for production (get from Stripe Dashboard → Live mode)

## Quick Test

After restarting, the payment flow should work:
1. Click "Pay Application Fee"
2. You should be redirected to Stripe Checkout (not see the error)
3. Use test card: `4242 4242 4242 4242`

## Still Not Working?

1. **Check server logs** for any environment variable errors
2. **Verify dotenv is loading:** The server imports `dotenv/config` at startup
3. **Check file encoding:** Ensure `.env` is saved as UTF-8
4. **Try setting the variable directly** (temporary test):
   ```bash
   # Windows PowerShell
   $env:STRIPE_SECRET_KEY="sk_test_your_key_here"
   pnpm dev
   ```

If it works with the direct environment variable but not with `.env`, there's an issue with the `.env` file format or location.



