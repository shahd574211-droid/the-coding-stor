# Phase 4: Storefront UI

## Overview

The storefront is a mobile-first public site: product listing, filters by category, product detail, cart, checkout entry, and WhatsApp OTP login. Built with Next.js 14 App Router, Tailwind CSS, and shadcn-style components.

---

## Structure

| Path | Purpose |
|------|--------|
| `src/app/(storefront)/` | Route group: public store |
| `src/app/(storefront)/page.tsx` | Home: featured products + categories |
| `src/app/(storefront)/products/page.tsx` | Product listing with category filter and pagination |
| `src/app/(storefront)/products/[slug]/page.tsx` | Product detail (add to cart, download note for digital) |
| `src/app/(storefront)/cart/page.tsx` | Cart (empty state; full cart requires auth) |
| `src/app/(storefront)/checkout/page.tsx` | Checkout gate (redirects to login) |
| `src/app/(auth)/login/page.tsx` | WhatsApp OTP: phone → send OTP → verify → set Supabase session |
| `src/components/ui/` | Button, Input, Card (shadcn-style) |
| `src/server/actions/products.ts` | getPublishedProducts, getProductBySlug, getCategories |
| `src/server/actions/cart.ts` | getCart, addToCart, updateCartItem, removeFromCart (require userId) |

---

## UI/UX

- **Layout**: Sticky header with logo, Products, Login, Cart; footer with copyright.
- **Theme**: CSS variables for light/dark (shadcn); dark mode via `class` on `<html>`.
- **Responsive**: Grid 1/2/4 columns; container with padding.
- **Product cards**: Image (or placeholder), name, category, price; link to detail.
- **Product detail**: Image, name, price, description, Add to cart; digital products show “Download after purchase”.
- **Login**: Two-step form (phone → OTP); on success sets Supabase session and redirects.

---

## Security

- Product data is read-only for storefront; only published products are shown.
- Cart and checkout require authenticated user (userId); Phase 4 cart page shows empty state until auth middleware provides userId.
- Login uses existing OTP API; session is stored via Supabase client `setSession`.

---

## Next Steps (Phase 5)

- Admin dashboard for product CRUD, orders, users, analytics.
- Middleware to resolve user from Supabase JWT and pass userId to Server Actions for cart/checkout.
