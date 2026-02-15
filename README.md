# the coding stor — E-commerce Platform

Production-grade e-commerce platform for **digital** and **physical** products, with WhatsApp OTP authentication, admin dashboard, and mobile app.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web & Dashboard | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Backend | Prisma ORM, Supabase (PostgreSQL, Auth, Storage) |
| Mobile | React Native (Expo) |
| Auth / OTP | UltraMsg WhatsApp API |

---

## Phases

| Phase | Deliverable | Location |
|-------|-------------|----------|
| **1** | System architecture | [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) |
| **2** | Database schema (Prisma) | `prisma/schema.prisma` |
| **3** | Auth (WhatsApp OTP) | `src/app/api/auth/`, `src/lib/auth/`, `src/lib/ultramsg/` |
| **4** | Storefront UI | `src/app/(storefront)/`, `src/components/storefront/` |
| **5** | Admin dashboard | `src/app/(dashboard)/`, `src/components/dashboard/` |
| **6** | Mobile app | `mobile/` (Expo) |
| **7** | Deployment | [docs/architecture/PHASE7_DEPLOYMENT.md](docs/architecture/PHASE7_DEPLOYMENT.md) |

---

## Quick Start (after Phase 3+)

1. Copy `.env.example` to `.env` and set Supabase + UltraMsg keys.
2. `pnpm install` (or npm/yarn).
3. `pnpm prisma generate && pnpm prisma migrate dev`.
4. `pnpm dev` — storefront at `http://localhost:3000`, admin at `http://localhost:3000/admin`.

---

## Security

- OTP is hashed before storage; rate limiting on send/verify.
- Role-based access (user vs admin) enforced in Server Actions and API routes.
- All inputs validated with Zod; Prisma used only on the server.

See [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) and [docs/architecture/ARCHITECTURE_DECISIONS.md](docs/architecture/ARCHITECTURE_DECISIONS.md) for full architecture and ADRs.
