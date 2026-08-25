# LifeOS — Setup (connecting the cloud)

LifeOS runs with **zero setup** in local mode. Follow this only when you want accounts, cross‑device sync, and Google sign‑in.

## 1. Create a Supabase project
1. Go to <https://supabase.com> → **New project**. Note the project URL and the **anon** public key (Project Settings → API).
2. Copy `.env.local.example` to `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   > The anon key is **safe to expose** — Row Level Security is the real boundary. Never put the `service_role` key in any `NEXT_PUBLIC_` variable.

## 2. Create the schema
Run the migration in **Supabase → SQL Editor** (paste the file contents) or with the Supabase CLI:
```bash
supabase db push        # if you use the CLI and have linked the project
# — or —
# open supabase/migrations/0001_init.sql and run it in the SQL Editor
```
This creates one table per entity with indexes, enables **RLS** with owner‑only policies, adds `updated_at` triggers, and provisions a private `lifeos` storage bucket.

## 3. Enable auth providers
Supabase → **Authentication → Providers**:
- **Email**: on by default.
- **Google**: enable it, then create OAuth credentials in Google Cloud Console. Set the authorized redirect URI to:
  ```
  https://YOUR-PROJECT.supabase.co/auth/v1/callback
  ```
  Put the Google client id/secret into Supabase’s Google provider settings.

Supabase → **Authentication → URL Configuration**: add your site URL and redirect URLs:
```
http://localhost:3000
http://localhost:3000/auth/callback
https://YOUR-DOMAIN/auth/callback   # for production
```

## 4. Run it
```bash
npm run dev
```
Visit `/login`. You’ll now get email + Google sign‑in. Your existing local data is **backfilled** to the cloud automatically on first sync.

## 5. Deploy (Vercel)
1. Push to GitHub, import the repo in Vercel.
2. Add the same environment variables in Vercel → Project → Settings → Environment Variables (set `NEXT_PUBLIC_SITE_URL` to your production URL).
3. Deploy. Add your production `…/auth/callback` URL to the Supabase and Google redirect lists.

## Troubleshooting
- **Stuck on the login splash / redirect loop** → check the anon key/URL and that your site + callback URLs are in Supabase’s allow‑list.
- **Google returns to `/login?error=auth`** → the redirect URI in Google/Supabase doesn’t match, or the code exchange failed; re‑check step 3.
- **Data not syncing** → open the app while online and signed in; the sync runs on login, on reconnect, and every 30s. Local mode never syncs by design.
