# Phase 3: Auth System (WhatsApp OTP)

## Overview

Authentication is phone-based: user enters phone → receives 6-digit OTP via UltraMsg WhatsApp API → verifies OTP → backend creates or finds User and Supabase Auth user → returns JWT session for website, dashboard, and mobile.

---

## Flow

1. **Send OTP**  
   `POST /api/auth/otp/send` with `{ phone }`  
   - Validate phone (Zod, E.164).  
   - Rate limit: 3 sends per phone per 15 minutes.  
   - Generate 6-digit OTP, hash with HMAC-SHA256 (server secret), store in `OTP` with 5-min expiry.  
   - Send OTP text via UltraMsg WhatsApp API.  
   - Return `{ success: true }` or error.

2. **Verify OTP**  
   `POST /api/auth/otp/verify` with `{ phone, code }`  
   - Validate input (Zod).  
   - Rate limit: 5 verify attempts per phone per 15 minutes.  
   - Find latest valid OTP for phone, verify code against stored hash (timing-safe).  
   - Mark OTP used, clear verify rate limit.  
   - Find or create `User` (by `phoneNormalized`).  
   - Get or create Supabase session:  
     - If User has no `supabaseUserId`: create Supabase user (email = `{phoneNormalized}@stor-ai.phone`, random password), store `supabaseUserId` and encrypted password on User.  
     - Sign in to Supabase with that email/password.  
   - Return `{ accessToken, refreshToken, expiresIn, user }`.

3. **Client**  
   - Store `accessToken` and `refreshToken` (e.g. in memory or secure cookie).  
   - Use Supabase client `setSession({ access_token, refresh_token })` so subsequent Supabase calls are authenticated.  
   - Use same API and session on web and mobile.

---

## Files

| Path | Purpose |
|------|--------|
| `src/lib/validations/auth.ts` | Zod schemas and phone normalization (E.164). |
| `src/lib/auth/rate-limit.ts` | In-memory rate limit for send/verify (production: use Redis or DB). |
| `src/lib/auth/otp.ts` | OTP generation, hashing, Prisma OTP create/find/markUsed. |
| `src/lib/auth/encryption.ts` | AES-256-GCM encrypt/decrypt for stored Supabase password. |
| `src/lib/auth/session.ts` | Get or create Supabase user and session after OTP verify. |
| `src/lib/ultramsg/client.ts` | UltraMsg API: send WhatsApp text (OTP message). |
| `src/lib/supabase/server.ts` | Server Supabase client (admin createUser, signIn). |
| `src/lib/supabase/client.ts` | Browser Supabase client (setSession, getSession). |
| `src/app/api/auth/otp/send/route.ts` | POST send OTP. |
| `src/app/api/auth/otp/verify/route.ts` | POST verify OTP and return session. |

---

## Security

- **OTP**: Stored only as HMAC-SHA256 hash; 5-minute expiry; single use; rate limited.  
- **Passwords**: Supabase user password is random; stored encrypted (AES-256-GCM) with `ENCRYPTION_KEY`; used only server-side for sign-in.  
- **Secrets**: `OTP_HASH_SECRET`, `ENCRYPTION_KEY`, `ULTRAMSG_*`, `SUPABASE_SERVICE_ROLE_KEY` in env only; never in client.  
- **Rate limiting**: In-memory here; for production use Redis or DB so limits apply across instances.

---

## Env

- `OTP_HASH_SECRET`: Secret for OTP hashing (min 32 chars).  
- `ENCRYPTION_KEY`: Secret for encrypting stored Supabase password (min 32 chars).  
- `ULTRAMSG_INSTANCE_ID`, `ULTRAMSG_TOKEN`: UltraMsg API.  
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Supabase.

---

## Role-Based Access

`User.role` (and optional `Admin` table) drive dashboard access. Middleware or Server Actions should reject dashboard routes when `user.role !== 'ADMIN'` (and optionally check `Admin`). Session is validated via Supabase JWT; user record (including role) is loaded from Prisma by `supabaseUserId` or from the session payload if you store role in custom claims.
