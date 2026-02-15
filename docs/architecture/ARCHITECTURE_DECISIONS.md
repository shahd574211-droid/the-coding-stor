# Architecture Decision Records (ADRs)

Brief rationale for key choices in the e-commerce platform.

---

## ADR-1: Next.js 14 App Router for Web and Dashboard

**Decision:** Use one Next.js 14 App Router application for both the public storefront and the admin dashboard.

**Rationale:**

- Single deployment, single API surface, and shared types (Prisma, Zod) reduce duplication and deployment drift.
- Route groups `(storefront)`, `(auth)`, and `(dashboard)` keep URLs and layouts clear without extra apps.
- Server Components reduce client JS and improve performance; Server Actions keep mutations type-safe and server-only.

**Alternatives considered:** Separate repo for dashboard (rejected: double maintenance). Pages Router (rejected: App Router is the supported direction).

---

## ADR-2: Prisma with Supabase PostgreSQL

**Decision:** Use Prisma ORM against Supabase-hosted PostgreSQL. Do not use Supabase client for primary app data (only Auth and Storage where needed).

**Rationale:**

- Prisma gives a single, type-safe schema and migration story; Supabase PostgreSQL is a compatible Postgres host.
- Keeping business logic in Prisma allows future DB migration if required; Supabase remains excellent for Auth and Storage.
- Prisma Client is used only on the server (API routes and Server Actions), never exposed to the browser.

**Alternatives considered:** Supabase client for all data (rejected: less control over schema and migrations). Raw SQL (rejected: no type safety by default).

---

## ADR-3: WhatsApp OTP via UltraMsg, Session via Supabase Auth

**Decision:** Send OTP via UltraMsg WhatsApp API; verify OTP on our backend; create or sign in Supabase user and return Supabase JWT/session.

**Rationale:**

- Users get a single, familiar channel (WhatsApp) for verification; no email/password to remember.
- Supabase Auth provides session management, JWTs, and refresh; we only replace the “how you get the user” part with OTP.
- OTP is generated and hashed on our server; UltraMsg is used only as a delivery channel, keeping security boundaries clear.

**Security:** OTP is hashed before storage; rate limiting on send/verify; short expiry; single use.

---

## ADR-4: Server Actions for Mutations, API Routes for External and Webhooks

**Decision:** Use Server Actions for internal mutations (cart, checkout, profile). Use API routes for OTP send/verify, webhooks, and any client that cannot use Server Actions (e.g. mobile).

**Rationale:**

- Server Actions simplify forms and progressive enhancement and work well with Zod and Prisma on the server.
- API routes are necessary for callbacks (e.g. payment webhooks) and for the mobile app, which will call the same API.
- Both paths validate input with Zod and enforce auth (session/JWT) and roles consistently.

---

## ADR-5: Role-Based Access in Application Layer

**Decision:** Store role (e.g. `user`, `admin`) in our database (e.g. `User` or `Admin` table) and enforce in Server Actions and API routes. Optionally add Supabase RLS later.

**Rationale:**

- Application-level checks are explicit and easy to audit; Prisma and middleware can enforce “admin-only” routes.
- Supabase RLS can be added as a second layer for defense in depth once the schema is stable.

---

## ADR-6: Digital Downloads via Time-Limited Signed URLs

**Decision:** Store files in Supabase Storage; serve download links as short-lived signed URLs (e.g. 1 hour) generated after payment verification.

**Rationale:**

- Prevents sharing of static URLs; each download is tied to the user and order and expires.
- Supabase Storage supports signed URLs; generation happens only on the server after we confirm the order is paid and the user owns the order.

---

## ADR-7: Monorepo with `src/` and Separate `mobile/` for Expo

**Decision:** Keep web and dashboard in `src/` under one Next.js app; keep the Expo app in a `mobile/` directory (or separate package) sharing the same API and Supabase config.

**Rationale:**

- One repo simplifies cross-stack changes (e.g. API contract, env) while keeping mobile build and tooling (Expo) separate.
- Mobile consumes the same REST/API and Supabase Auth; no Prisma on the client.

---

## ADR-8: Zod for All Input Validation

**Decision:** Validate all request body and query inputs with Zod schemas before use in Server Actions and API routes.

**Rationale:**

- Single source of truth for shape and types; TypeScript inference from schemas reduces drift.
- Fails fast with clear errors; supports sanitization and transformation (e.g. phone normalization).

---

## Summary

These decisions prioritize type safety (Prisma, Zod), security (OTP hashing, rate limits, RBAC), and operability (one Next.js deploy, Supabase managed services, clear boundaries). Each phase (schema, auth, storefront, dashboard, mobile, deployment) will implement these choices consistently.
