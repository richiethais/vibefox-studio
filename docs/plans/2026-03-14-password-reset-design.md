# Password Reset Flow Design

## Summary

Add a password reset flow using Supabase's built-in `resetPasswordForEmail` and `updateUser` APIs. Clients get a "Forgot password?" link on their login page. Admins reset via Supabase dashboard only (no UI link). Both use a shared `/reset-password` page to complete the reset.

## Components

### 1. Client Login — "Forgot password?" link
- Add link below sign-in button on `/client/login`
- Links to `/reset-password`
- Admin login page unchanged (no link)

### 2. Shared Reset Page (`/reset-password`)

**Step 1 — Request mode (default):**
- Email input form
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<site>/reset-password' })`
- Shows "Check your email" confirmation message

**Step 2 — Recovery mode (after clicking email link):**
- Supabase client auto-detects `PASSWORD_RECOVERY` event via `onAuthStateChange`
- Shows password + confirm password form
- Calls `supabase.auth.updateUser({ password })`
- Shows success message with link to `/client/login`

### 3. Visual Style
- Matches existing login pages: `#f5f3f0` background, white card, dark button, BrandLogo

## Files Changed

| File | Change |
|------|--------|
| `src/pages/ResetPassword.jsx` | New — shared reset page |
| `src/pages/client/Login.jsx` | Add "Forgot password?" link |
| `src/main.jsx` | Add `/reset-password` route |
