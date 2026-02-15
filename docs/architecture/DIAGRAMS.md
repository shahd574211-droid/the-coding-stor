# Architecture Diagrams (Mermaid)

Standalone diagrams for documentation and presentations.

---

## High-Level System

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
        Web["Next.js Storefront"]
        Dashboard["Admin Dashboard"]
        Mobile["React Native (Expo)"]
    end

    subgraph Edge["Edge / API Layer"]
        Vercel["Vercel"]
        API["Next.js API + Server Actions"]
    end

    subgraph Backend["Backend"]
        Prisma["Prisma ORM"]
        SupabaseDB[(Supabase PostgreSQL)]
        SupabaseAuth["Supabase Auth"]
        SupabaseStorage["Supabase Storage"]
        UltraMsg["UltraMsg (WhatsApp OTP)"]
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
```

---

## WhatsApp OTP Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (Web/App)
    participant API as Next.js API
    participant DB as OTP Store
    participant WM as UltraMsg
    participant SA as Supabase Auth

    U->>C: Enter phone
    C->>API: POST /api/auth/otp/send
    API->>API: Validate, rate limit, generate OTP
    API->>DB: Store hashed OTP, expiry
    API->>WM: Send OTP via WhatsApp
    WM-->>U: WhatsApp message
    API-->>C: success

    U->>C: Enter OTP
    C->>API: POST /api/auth/otp/verify
    API->>DB: Verify OTP
    alt valid
        API->>SA: getOrCreateUser, signIn
        SA-->>API: JWT
        API->>DB: Invalidate OTP
        API-->>C: session
    else invalid
        API-->>C: 401
    end
```

---

## Order Lifecycle (Digital + Physical)

```mermaid
stateDiagram-v2
    [*] --> Pending: Order created
    Pending --> Paid: Payment confirmed
    Paid --> Processing: Fulfillment started
    Processing --> Delivered: Shipped / links sent
    Delivered --> Completed: User confirms / expiry
    Completed --> [*]
    Pending --> Cancelled: Timeout / user cancel
    Paid --> Refunded: Refund
```

---

## Folder Structure (Target)

```mermaid
flowchart LR
    subgraph app["src/app"]
        storefront["(storefront)"]
        auth["(auth)"]
        dashboard["(dashboard)"]
        api["api/"]
    end
    subgraph lib["src/lib"]
        db["db/"]
        auth_lib["auth/"]
        ultramsg["ultramsg/"]
        validations["validations/"]
    end
    subgraph prisma["prisma"]
        schema["schema.prisma"]
    end
    app --> lib
    lib --> prisma
```

These diagrams are also embedded in [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md).
