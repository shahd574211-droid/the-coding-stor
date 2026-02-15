# Seed data

Run after migrations (with `DATABASE_URL` set and DB reachable):

```bash
npx prisma db seed
```

Or: `npm run db:seed`

## What gets seeded

- **Categories**: Digital Templates, Courses, Physical Products
- **Products**: 5 items (2 digital templates, 1 course, 2 physical) — all published
- **Admin user**: phone `+15550000001` — log in via WhatsApp OTP, then open `/admin`
- **Customer user**: phone `+15550000002` — sample customer
- **Orders**: 2 sample orders for the customer (if none exist)
- **Digital asset**: One file linked to the Notion Life Planner product

Re-running the seed is safe: categories and products are upserted by slug; admin/customer by phone; orders and digital assets are created only when none exist.
