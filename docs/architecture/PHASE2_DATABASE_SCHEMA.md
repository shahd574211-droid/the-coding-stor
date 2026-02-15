# Phase 2: Database Schema (Prisma)

## Overview

The schema is designed for a multi-channel e-commerce platform with WhatsApp OTP auth, digital and physical products, role-based access, and order lifecycle tracking. It runs on **Supabase PostgreSQL** via Prisma.

---

## Models Summary

| Model | Purpose |
|-------|--------|
| **User** | Customer account; linked to Supabase Auth via `supabaseUserId`. Identified by `phone` (E.164). |
| **OTP** | One-time passwords for WhatsApp login: hashed value, expiry, single-use. |
| **Session** | Optional server-side session/refresh-token tracking for revocation and audit. |
| **Admin** | Links a User to admin role (e.g. SUPER_ADMIN) for dashboard access. |
| **Category** | Product taxonomy; supports hierarchy via `parentId`. |
| **Product** | Catalog item; `type` = DIGITAL or PHYSICAL; `published` controls visibility. |
| **DigitalAsset** | File metadata for digital products (Supabase Storage path, expiry for download links). |
| **Order** | Purchase; status flow PENDING → PAID → PROCESSING → DELIVERED → COMPLETED. |
| **OrderItem** | Line item; optional `digitalAssetId` for multi-file products. |
| **CartItem** | Per-user cart; one row per user+product with quantity. |

---

## Design Decisions

### Auth & Users

- **User.phone** and **User.phoneNormalized**: E.164 stored; normalized (digits only) for consistent lookups and OTP matching.
- **User.supabaseUserId**: After OTP verify we create or sign in Supabase Auth user and store its ID here for JWT validation and RLS (if used).
- **OTP.otpHash**: Only a hash of the OTP is stored; plain OTP never persisted. Expiry (e.g. 5 min) and single-use enforced in app logic.
- **Admin**: Separate table so a User can have an admin role without overloading the User model; easy to extend (e.g. permissions).

### Catalog

- **Product.type**: DIGITAL vs PHYSICAL drives fulfillment (download links vs shipping).
- **Product.stock**: Null = unlimited or digital; only physical products need stock.
- **DigitalAsset**: One product can have multiple files (e.g. template pack). Download links are generated on demand with short-lived signed URLs; `downloadExpiresInHours` is metadata for UI/Policy.

### Orders

- **Order.status**: PENDING → PAID → PROCESSING → DELIVERED → COMPLETED; plus CANCELLED, REFUNDED.
- **Order.shippingAddress**: JSON for flexibility (address, city, country, postalCode, phone); validate with Zod in app.
- **OrderItem.digitalAssetId**: Optional; when set, fulfillment uses this asset for download; when null, product may have multiple assets and we fulfill all.

### Cart

- **CartItem**: Server-side cart keyed by `userId` and `productId`; quantity updated on add/update. Supports logged-in users only (required for checkout).

---

## Security Considerations

1. **OTP**: Stored only as hash; rate limiting on send/verify in API layer.
2. **Sessions**: Optional token hash in Session for “logout all devices” or audit; primary session is Supabase JWT.
3. **RLS**: Supabase RLS can be added later on top of this schema for defense in depth; app layer enforces RBAC today.
4. **PII**: Phone and shipping address are PII; ensure encryption at rest (Supabase default) and access control via RBAC.

---

## Indexes

- **OTP**: `(phone, expiresAt)` and `(phone)` for fast lookup and cleanup of expired OTPs.
- **Product**: `(slug)`, `(categoryId)`, `(type, published)` for storefront listing and detail pages.
- **Order**: `(userId)`, `(status)`, `(createdAt)` for user orders and admin filters.
- **CartItem**: `(userId)` and unique `(userId, productId)` for cart operations.

---

## Migrations

After cloning and setting `DATABASE_URL` in `.env`:

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
```

For production:

```bash
pnpm prisma migrate deploy
```

Schema is the single source of truth; all app code uses Prisma Client with these types.
