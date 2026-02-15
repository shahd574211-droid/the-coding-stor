# Phase 6: Mobile App (Expo)

## Overview

The mobile app is a React Native (Expo) app that uses the same backend: OTP send/verify API, Supabase Auth session, and products API. It provides browse products, product detail, and WhatsApp OTP login.

---

## Structure

| Path | Purpose |
|------|--------|
| `mobile/app/_layout.tsx` | Expo Router root layout (stack). |
| `mobile/app/index.tsx` | Home: browse products, login / sign out. |
| `mobile/app/login.tsx` | WhatsApp OTP: phone → send OTP → verify → set Supabase session. |
| `mobile/app/products/index.tsx` | Product list (grid). |
| `mobile/app/products/[slug].tsx` | Product detail. |
| `mobile/lib/api.ts` | sendOtp, verifyOtp, getProducts, getProduct (fetch to Next.js API). |
| `mobile/lib/supabase.ts` | Supabase client for setSession / getSession / signOut. |

---

## API

The app calls the same Next.js API as the web:

- `POST /api/auth/otp/send` — send OTP (body: `{ phone }`).
- `POST /api/auth/otp/verify` — verify OTP (body: `{ phone, code }`); returns `accessToken`, `refreshToken`, `user`.
- `GET /api/products` — list products (query: `category`, `limit`, `offset`).
- `GET /api/products/[slug]` — product detail.

Set `EXPO_PUBLIC_API_URL` to your deployed Next.js URL (e.g. `https://your-app.vercel.app`). For local dev, use your machine IP and port (e.g. `http://192.168.1.x:3000`) so the device/emulator can reach the API.

---

## Auth

- After verify, the app calls `supabase.auth.setSession({ access_token, refresh_token })` so Supabase client is authenticated.
- Home screen uses `supabase.auth.getSession()` to show “Log in” vs “Sign out”.
- Same JWT/session works on web and mobile.

---

## Env

- `EXPO_PUBLIC_API_URL`: Next.js API base URL.
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase project.

---

## Run

```bash
cd mobile
npm install
npx expo start
```

Then open on device/emulator. Set env in `.env` or EAS env for builds.

---

## Optional (not implemented)

- Orders list and download links (would require authenticated API routes and download URL generation).
- Push notifications (Expo Notifications + backend).
- Cart and checkout in-app (could call same Server Actions via API or add REST endpoints).
