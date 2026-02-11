# Supabase Setup for Vensoc

Run these steps in your Supabase project before testing the app end-to-end.

## 1. Authentication
1. Go to `Authentication` -> `Providers`.
2. Enable `Email` provider.
3. Enable `Google` provider.
4. In `Authentication` -> `URL Configuration`, add:
- `http://localhost:3000`

### Google Provider Setup
- In Google Cloud Console, create OAuth credentials for a web app.
- Add Supabase callback URL shown in your Supabase Google provider screen.
- Add `http://localhost:3000` as an authorized JavaScript origin.
- Copy Google client ID/secret into Supabase Google provider settings.

## 2. Database schema and RLS
1. Open `SQL Editor`.
2. Run `supabase/migrations/001_vensoc_schema.sql`.
3. Run `supabase/migrations/002_activity_and_reliability_foundation.sql`.
4. Run `supabase/migrations/003_organizer_venmo_profile.sql`.
5. Run `supabase/migrations/004_prevent_organizer_self_join.sql`.
6. Confirm `events`, `participants`, `participant_activity_logs`, and `organizer_profiles` objects exist.
7. Confirm RLS is enabled on `events`, `participants`, `participant_activity_logs`, and `organizer_profiles`.

## 3. Environment variables
In local `.env.local`, set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is intended to be used in browsers.
Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

## 4. What you must configure in Supabase
- Auth provider enabled (email/password at minimum)
- Redirect URL for local dev
- SQL schema + RLS policies applied

After this, run the app and test:
- Organizer login/signup
- Event creation
- Join-and-pay flow from a public event link
