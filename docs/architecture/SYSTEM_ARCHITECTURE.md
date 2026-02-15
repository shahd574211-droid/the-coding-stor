# Phase 1: System Architecture

## E-commerce Platform — Production Architecture

This document describes the system architecture for a scalable e-commerce platform supporting digital and physical products, WhatsApp OTP authentication, and multi-channel access (Web, Admin Dashboard, Mobile).

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
        Web["Next.js Storefront<br/>(App Router)"]
        Dashboard["Admin Dashboard<br/>(Next.js)"]
        Mobile["React Native (Expo)<br/>Mobile App"]
    end

    subgraph Edge["Edge / API Layer"]
        Vercel["Vercel Edge"]
        API["Next.js API Routes<br/>+ Server Actions"]
    end

    subgraph Backend["Backend Services"]
        Prisma["Prisma ORM"]
        SupabaseDB[(Supabase<br/>PostgreSQL)]
        SupabaseAuth["Supabase Auth<br/>(JWT Sessions)"]
        SupabaseStorage["Supabase Storage<br/>(Files & Assets)"]
        UltraMsg["UltraMsg API<br/>(WhatsApp OTP)"]
    end

    Web --> Vercel
    Dashboard --> Vercel
    Mobile --> Vercel
    Vercel --> API
    API --> Prisma
    API --> SupabaseAuth
    API --> UltraMsg
    Prisma --> SupabaseDB
    API --> SupabaseStorage
    SupabaseAuth --> SupabaseDB
```

**Rationale:**

- **Single deployment (Vercel)** for web and dashboard reduces ops and keeps one API surface.
- **Prisma as API data layer** gives type-safe queries and migrations; Supabase remains the PostgreSQL host.
- **Supabase Auth** stores users and issues JWTs; we use custom OTP flow that then creates/updates Supabase users.
- **UltraMsg** is the only external dependency for sending OTP; all other auth state lives in Supabase.

---

## 2. Authentication Architecture (WhatsApp OTP)

```mermaid
sequenceDiagram
    participant User
    participant WebOrApp
    participant API
    participant OTPStore
    participant UltraMsg
    participant Supabase

    User->>WebOrApp: Enter phone number
    WebOrApp->>API: POST /api/auth/otp/send
    API->>API: Validate phone (Zod), rate limit
    API->>API: Generate 6-digit OTP, hash
    API->>OTPStore: Store hash, expiry (5 min)
    API->>UltraMsg: Send OTP via WhatsApp
    UltraMsg-->>User: WhatsApp message with OTP
    API-->>WebOrApp: { success: true }

    User->>WebOrApp: Enter OTP
    WebOrApp->>API: POST /api/auth/otp/verify
    API->>OTPStore: Get OTP by phone, verify hash
    alt OTP invalid or expired
        API-->>WebOrApp: 401 Unauthorized
    else OTP valid
        API->>Supabase: getUserByPhone or createUser
        API->>Supabase: signIn (custom token) or createSession
        Supabase-->>API: JWT + refresh token
        API->>OTPStore: Invalidate OTP
        API-->>WebOrApp: { session, user }
    end
```

**Security considerations:**

- OTP is **hashed** before storage (e.g. bcrypt or SHA-256 with server secret); never store plain OTP.
- **Rate limiting** on send and verify (e.g. 3 sends per phone per 15 min, 5 verify attempts per 15 min).
- **Expiry**: OTP valid for 5 minutes only.
- **Single use**: OTP is deleted after successful verification.
- **Phone format**: Normalize and validate (E.164) before sending.

---

## 3. Data Flow Architecture

```mermaid
flowchart LR
    subgraph ReadPath["Read Path"]
        ClientR[Client]
        ServerR[Server Components / API]
        PrismaR[Prisma]
        DB[(PostgreSQL)]
        ClientR --> ServerR
        ServerR --> PrismaR
        PrismaR --> DB
    end

    subgraph WritePath["Write Path"]
        ClientW[Client]
        Action[Server Actions]
        Validate[Zod Validate]
        PrismaW[Prisma]
        ClientW --> Action
        Action --> Validate
        Validate --> PrismaW
        PrismaW --> DB
    end
```

- **Server Components** and **API routes** perform all Prisma reads; no Prisma client exposed to the browser.
- **Server Actions** handle mutations with **Zod** validation and optional CSRF protection (Next.js built-in for same-origin).
- **Prisma** is the single interface to Supabase PostgreSQL; Supabase Storage is used only for file upload/download URLs.

---

## 4. Component Breakdown

| Component | Responsibility | Tech |
|-----------|----------------|------|
| **Storefront** | Product listing, cart, checkout, digital downloads | Next.js 14 (App Router), Tailwind, shadcn/ui |
| **Admin Dashboard** | Product CRUD, orders, users, analytics, file upload | Next.js 14, same UI stack, role-based routes |
| **API Layer** | Auth (OTP send/verify), orders, products, webhooks | Next.js API routes + Server Actions |
| **Auth** | OTP generation, UltraMsg send, Supabase user create/sign-in, JWT | Custom API + Supabase Auth |
| **Database** | Users, OTPs, products, orders, assets, sessions | Supabase (PostgreSQL) via Prisma |
| **Storage** | Digital assets, product files, admin uploads | Supabase Storage |
| **Mobile App** | Browse, login via OTP, orders, downloads | React Native (Expo), same API + Supabase client |

---

## 5. Security Architecture

```mermaid
flowchart TB
    subgraph Perimeter["Perimeter"]
        RateLimit["Rate limiting (OTP, API)"]
        CORS["CORS policy"]
        Validation["Input validation (Zod)"]
    end

    subgraph AuthZ["Authorization"]
        RBAC["Role-based access (Admin vs User)"]
        JWT["JWT validation (Supabase)"]
        Session["Session checks in Server Actions"]
    end

    subgraph Data["Data Security"]
        HashOTP["OTP hashing"]
        Env["Secrets in env (UltraMsg, Supabase)"]
        RLS["Supabase RLS (optional extra layer)"]
    end

    Request[Incoming request] --> RateLimit
    RateLimit --> CORS
    CORS --> Validation
    Validation --> JWT
    JWT --> RBAC
    RBAC --> Session
    Session --> HashOTP
    HashOTP --> Env
    Env --> RLS
```

- **Perimeter**: Rate limiting on auth and critical APIs; strict CORS; Zod on all inputs.
- **Authorization**: Roles (e.g. `user`, `admin`) stored in DB and enforced in Server Actions and API routes; JWT from Supabase validated on each request.
- **Data**: OTP hashed; no secrets in client; Supabase credentials in env; RLS can be added for defense in depth.

---

## 6. Deployment Architecture

```mermaid
flowchart TB
    subgraph Vercel["Vercel"]
        NextApp["Next.js App<br/>(Storefront + Dashboard + API)"]
    end

    subgraph SupabaseCloud["Supabase"]
        PG[(PostgreSQL)]
        Auth["Auth"]
        Storage["Storage"]
    end

    subgraph External["External"]
        UltraMsg["UltraMsg API"]
    end

    subgraph MobileDeploy["Mobile"]
        EAS["Expo EAS Build"]
        Store["App Store / Play Store"]
        EAS --> Store
    end

    UsersWeb["Web Users"] --> NextApp
    UsersMobile["Mobile Users"] --> NextApp
    NextApp --> PG
    NextApp --> Auth
    NextApp --> Storage
    NextApp --> UltraMsg
```

- **Vercel**: Hosts Next.js (storefront, dashboard, API, Server Actions). One project, multiple routes.
- **Supabase**: Managed PostgreSQL, Auth (JWT), Storage; connection string and keys in Vercel env.
- **UltraMsg**: Called from Next.js server only; API key in env.
- **Mobile**: Expo app consumes same Next.js API and Supabase; distributed via EAS and stores.

---

## 7. Folder Structure (Planned)

```
stor-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (storefront)/       # Public store
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   └── checkout/
│   │   ├── (auth)/             # Login (OTP)
│   │   │   └── login/
│   │   ├── (dashboard)/        # Admin (protected)
│   │   │   ├── admin/
│   │   │   │   ├── products/
│   │   │   │   ├── orders/
│   │   │   │   └── users/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── otp/
│   │   │   │   │   ├── send/
│   │   │   │   │   └── verify/
│   │   │   │   └── session/
│   │   │   ├── webhooks/
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn
│   │   ├── storefront/
│   │   ├── dashboard/
│   │   └── shared/
│   ├── lib/
│   │   ├── db/                 # Prisma client
│   │   ├── auth/
│   │   ├── ultramsg/
│   │   ├── supabase/
│   │   ├── validations/        # Zod schemas
│   │   └── utils/
│   ├── server/
│   │   ├── actions/            # Server Actions
│   │   └── middleware/
│   └── types/
├── prisma/
│   └── schema.prisma
├── docs/
│   └── architecture/
├── mobile/                     # Expo app (Phase 6)
└── public/
```

---

## 8. Phase Summary

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | System architecture (this doc) | Done |
| 2 | Database schema (Prisma) | Next |
| 3 | Auth (WhatsApp OTP) | Pending |
| 4 | Storefront UI | Pending |
| 5 | Admin dashboard | Pending |
| 6 | Mobile app | Pending |
| 7 | Deployment | Pending |

This architecture is designed for **scalability** (stateless API, managed DB and storage), **security** (OTP hashing, rate limits, RBAC, validation), and **maintainability** (single codebase for web/dashboard, type-safe Prisma, clear boundaries).
