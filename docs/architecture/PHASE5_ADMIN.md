# Phase 5: Admin Dashboard

## Overview

The admin dashboard is a protected area for product CRUD, order management, user listing, and analytics. Access is restricted to users with `User.role === 'ADMIN'` or an `Admin` record. Session is resolved server-side via Supabase SSR (cookies) and Prisma User/Admin.

---

## Structure

| Path | Purpose |
|------|--------|
| `src/app/(dashboard)/admin/layout.tsx` | Admin layout: requires admin, sidebar nav |
| `src/app/(dashboard)/admin/page.tsx` | Dashboard home: counts (orders, products, users), recent orders |
| `src/app/(dashboard)/admin/products/page.tsx` | Product list with edit links |
| `src/app/(dashboard)/admin/products/new/page.tsx` | New product form |
| `src/app/(dashboard)/admin/products/[id]/edit/page.tsx` | Edit product form |
| `src/app/(dashboard)/admin/orders/page.tsx` | Order list |
| `src/app/(dashboard)/admin/users/page.tsx` | User list |
| `src/components/dashboard/product-form.tsx` | Reusable product form (name, slug, price, type, category, published, etc.) |
| `src/server/actions/admin-products.ts` | listProducts, getProductForEdit, createProduct, updateProduct, deleteProduct (all require admin) |
| `src/server/actions/admin-orders.ts` | updateOrderStatus (require admin) |
| `src/lib/auth/get-current-user.ts` | getCurrentUser (Supabase session → Prisma User + Admin), requireAdmin |

---

## Auth

- **Session**: Supabase SSR stores session in cookies; middleware refreshes tokens; Server Components use `createServerSupabaseClient()` to read session.
- **Admin check**: `getCurrentUser()` loads User by `supabaseUserId` and checks `user.role === 'ADMIN'` or `user.admin != null`. Admin layout calls `getCurrentUser()` and redirects to `/login?redirect=/admin` if not logged in, or shows error if not admin.
- **Actions**: All admin Server Actions call `requireAdmin()` first (throws if not admin).

---

## Features

- **Products**: List, create, edit (name, slug, description, price, type, category, image URL, published, stock). Digital file upload (Supabase Storage + DigitalAsset) can be added in a follow-up (e.g. upload API + form field).
- **Orders**: List with user, status, total, date. Status update action is available for integration (e.g. dropdown in a future order detail page).
- **Users**: List phone, name, role, admin role, joined date.
- **Analytics**: Dashboard shows total orders, products, users and recent orders.

---

## Security

- All admin routes and actions enforce admin role via `requireAdmin()`.
- Prisma is used only on the server; admin actions are Server Actions.
- No client-side exposure of admin-only APIs.

---

## Making a user admin

Create an `Admin` record for the user (e.g. via Prisma Studio or a seed script):

```ts
await prisma.admin.create({
  data: { userId: "<user-id>", role: "ADMIN" },
});
```

Optionally set `User.role` to `ADMIN` for consistency; `getCurrentUser().isAdmin` is true if either `user.role === 'ADMIN'` or `user.admin != null`.
