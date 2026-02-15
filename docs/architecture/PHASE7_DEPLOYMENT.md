# Phase 7: Deployment (Vercel + Supabase)

## Overview

Deploy the Next.js app (storefront, dashboard, API) on **Vercel**. Use **Supabase** for PostgreSQL, Auth, and Storage. Configure env and run migrations. Optional: Expo EAS for mobile builds.

---

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → Database**, copy the connection string. Use the **Transaction** pooler for Prisma (port 6543, `?pgbouncer=true`) or the direct URL for migrations.
3. In **Project Settings → API**, note:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Run migrations against the Supabase DB:

   ```bash
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true" pnpm prisma migrate deploy
   ```

5. **Storage**: Create a bucket (e.g. `digital-assets`) for product files if you use uploads. Configure RLS as needed.

---

## 2. Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. **Framework**: Next.js (auto-detected). Root directory: project root (where `package.json` and `next.config.js` are).
3. **Build**: `pnpm build` (or `npm run build`). Install command: `pnpm install` (or `npm ci`).
4. **Environment variables** (Vercel project → Settings → Environment Variables):

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | Supabase connection string | Use pooler URL with `?pgbouncer=true` for serverless |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Server-only; never expose |
   | `ULTRAMSG_INSTANCE_ID` | UltraMsg instance ID | |
   | `ULTRAMSG_TOKEN` | UltraMsg token | |
   | `OTP_HASH_SECRET` | Random secret (≥32 chars) | For OTP hashing |
   | `ENCRYPTION_KEY` | Random secret (≥32 chars) | For encrypted Supabase password storage |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | For redirects / links |

5. Deploy. After deploy, run migrations if not already done (or use Vercel build command that runs `prisma migrate deploy` in a one-off step; typically migrations are run separately or in CI).

---

## 3. Post-deploy checks

- **Storefront**: `https://your-app.vercel.app` — products, categories, product detail.
- **Login**: `https://your-app.vercel.app/login` — phone → OTP → session (requires UltraMsg configured).
- **Admin**: `https://your-app.vercel.app/admin` — redirects to login if not authenticated; requires admin user (create `Admin` record or set `User.role = 'ADMIN'` in DB).
- **API**: `https://your-app.vercel.app/api/auth/otp/send` (POST), `/api/auth/otp/verify` (POST), `/api/products` (GET).

---

## 4. Mobile (Expo)

1. In `mobile/.env` (or EAS env), set:
   - `EXPO_PUBLIC_API_URL=https://your-app.vercel.app`
   - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same as web).
2. Run the app: `cd mobile && npx expo start`. Use tunnel or same network so the device can reach the API.
3. For production builds (EAS):
   - Install EAS CLI: `npm i -g eas-cli`, log in with Expo account.
   - In `mobile/`, run `eas build --platform android` (or `ios`). Set env in EAS project settings.
   - Submit to stores with `eas submit` or manual upload.

---

## 5. Security checklist

- Never commit `.env` or put `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `OTP_HASH_SECRET`, or `ULTRAMSG_TOKEN` in client or repo.
- Use Vercel env for production; optionally use different Supabase/UltraMsg keys for staging.
- Rate limiting: in-memory limits are per instance; for production consider Redis (e.g. Upstash) for OTP rate limits across instances.
- Supabase RLS: optional extra layer on top of app-level RBAC; enable and define policies for `public` tables if desired.

---

## 6. Optional: Run migrations in Vercel build

To run migrations on every deploy (optional; often done in CI or manually):

In `package.json`:

```json
"build": "prisma migrate deploy && next build"
```

Ensure `DATABASE_URL` is available at build time (Vercel injects env at build). Prefer running migrations from a single place (e.g. CI or one-off) to avoid concurrent migrations.
