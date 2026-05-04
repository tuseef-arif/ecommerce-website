# Mobile Shop Daily Milestones

This file is our daily execution tracker for building the Mobile Shop E-commerce platform in a controlled sequence.

## Milestone 1 - Database Foundation (Days 1-3)

### Day 1: Database Decision + Environment Setup

- [x] Choose primary DB engine (`PostgreSQL` recommended, `MySQL` acceptable).
- [x] Install and run database service on the same server.
- [x] Create database and application user.
- [x] Add `.env` entries (`DATABASE_URL`, auth secrets placeholders).
- [x] Exit criteria: app can connect to DB host and credentials are valid.

Day 1 progress (2026-05-01):

- Added `.env.example` with `DATABASE_URL` and `AUTH_SECRET` placeholders.
- Added local `.env.local` defaults for a local PostgreSQL instance.
- Added `npm run db:check` (`scripts/check-db.mjs`) to validate DB connectivity quickly.
- Verified successful DB connectivity with `ecommerce_app` user.

### Day 2: Prisma Bootstrap

- [x] Install Prisma + Prisma Client.
- [x] Initialize `prisma/schema.prisma`.
- [x] Configure datasource/provider to match chosen DB.
- [x] Create first migration baseline.
- [x] Exit criteria: `prisma migrate` succeeds and tables are created.

Day 2 plan (Completed):

- Install `prisma` and `@prisma/client`.
- Run `npx prisma init` and point datasource to PostgreSQL (`DATABASE_URL`).
- Create baseline schema with first `User` model (minimal scaffold for migration check).
- Run `npx prisma migrate dev --name init` to create and apply first migration.
- Validate generated client and run quick sanity query script.
- Update this file with completed checklist + blockers + next step for Day 3.

Day 2 progress (2026-05-01):

- Installed `prisma` and `@prisma/client`.
- Initialized Prisma (`prisma/schema.prisma`, `prisma.config.ts`, `.env`).
- Added baseline `User` model and `UserRole` enum.
- Ran `npx prisma db push` successfully and generated client to `src/generated/prisma`.
- Added reusable client singleton at `src/lib/prisma.ts`.
- Resolved migration blocker by enabling required DB permission and resetting local dev schema.
- Ran `npx prisma migrate dev --name init` successfully.
- Verified with `npx prisma migrate status`: 1 migration found and schema is up to date.

### Day 3: Core Schema + Seed Data

- [x] Add models: `User`, `Category`, `Product`, `CartItem`, `Order`, `OrderItem`, `GlobalSetting`, `CategorySaleOverride`.
- [x] Add indexes and unique constraints.
- [x] Create `seed.ts` for admin user, default categories, and sample products.
- [x] Exit criteria: seeded data is queryable in app.

Day 3 progress (2026-05-01):

- Expanded `prisma/schema.prisma` with all core e-commerce models, relations, enums, and indexes.
- Applied migration: `20260501173742_day3_core_schema`.
- Added `prisma/seed.ts` with idempotent upserts for admin user, categories, products, and global settings.
- Configured Prisma 7 seeding in `prisma.config.ts` and added `npm run prisma:seed`.
- Seed command now executes successfully against local PostgreSQL.

## Milestone 2 - Auth and RBAC (Days 4-5)

### Day 4: Auth.js Integration

- [x] Add Auth.js with credentials provider.
- [x] Implement registration + login pages.
- [x] Hash passwords securely.
- [x] Exit criteria: user can register and log in.

Day 4 progress (2026-05-02):

- Installed `next-auth`, `zod`, and `bcryptjs`.
- Added Auth.js credentials setup in `src/auth.ts` and API handlers at `src/app/api/auth/[...nextauth]/route.ts`.
- Added secure password utilities in `src/lib/password.ts` with bcrypt hashing and legacy scrypt verification fallback.
- Implemented validated registration flow in `src/app/(auth)/register/actions.ts` + `src/app/(auth)/register/page.tsx`.
- Implemented validated login flow in `src/app/(auth)/login/login-form.tsx` + `src/app/(auth)/login/page.tsx`.
- Updated home page (`src/app/(shop)/page.tsx`) to reflect authenticated state and added server-side logout action in `src/app/(shop)/actions.ts`.
- Seed now hashes admin password with bcrypt for consistency with login verification.
- Reorganized routes into App Router route groups: `src/app/(shop)`, `src/app/(auth)`, and `src/app/(admin)`.

### Day 5: Role-Based Access Control and Storefront Shell

- [x] Add `ADMIN` and `USER` roles.
- [x] Implement server-side guards (`requireUser`, `requireAdmin`).
- [x] Protect admin routes and actions.
- [x] Store header and navigation (logo, links, search, account/cart entry points, responsive behavior).
- [x] Store footer (gradient bar, contact and payment blocks, embedded map, copyright strip).
- [x] Hero banner (carousel, swipe/touch, reduced-motion handling, product slides from config).
- [x] Category slider (horizontal strip, arrow-controlled scroll, snap/scroll behavior).
- [x] Full-width responsive shop layout (shared `STORE_SHELL` padding, no narrow `max-w-*` gutters on main shop chrome).
- [x] Application design and color scheme for the public shop (consistent blues/oranges, cards, typography, and component polish).
- Exit criteria: non-admin cannot access admin actions/routes; shop pages use the shared shell and look coherent from header through footer on common viewport sizes.

Day 5 progress (2026-05-02):

- Added server-side guard utilities in `src/lib/auth-guards.ts`.
- Added admin route protection via `src/app/(admin)/admin/layout.tsx` and `src/app/(admin)/admin/page.tsx`.
- Added admin-only server action in `src/app/(admin)/admin/actions.ts` protected by `requireAdmin` and validated with Zod.
- Implemented store chrome in `src/components/store/store-header.tsx` and `src/components/store/store-footer.tsx` (including map, social, and payment areas); adjusted footer bar spacing in `src/app/globals.css` where needed.
- Built hero experience in `src/components/store/hero-banner.tsx` with phone data in `src/lib/hero-phones.ts` and related copy in `src/lib/site-config.ts`.
- Built category navigation in `src/components/store/category-slider.tsx` with shared slider arrow styling in `src/components/store/store-slider-arrows.tsx`.
- Centralized full-width shop horizontal padding via `STORE_SHELL` in `src/lib/site-config.ts` and applied it across header, footer, hero, category strip, and shop `main` routes under `src/app/(shop)/`.
- Expanded account flows in the header popover: login + sign-up UX hardening, forgot-password request, and reset-password completion flow.
- Added password reset server actions and DB-backed reset token lifecycle (issue, verify, expire, consume) in `src/app/(auth)/password-reset-actions.ts`.
- Added account profile CRUD capabilities (view/update profile fields and profile image path handling) integrated into store account popover interactions.
- Added profile photo upload support with persisted file paths and storefront account avatar/menu updates.
- Refined account popover architecture by splitting constants, styles, helpers, dialog, and form components for maintainability.
- Updated auth email delivery and templates for sign-up OTP and password reset mails (`src/lib/auth/signup-otp-email.ts`, `src/lib/auth/password-reset-email.ts`, and mail transport refinements).
- Added and wired supporting auth modules for sign-up OTP and password reset flows (`src/lib/auth/signup-otp-service.ts`, `src/lib/auth/password-reset-email.ts`, `src/lib/auth/signup-otp-email.ts`).
- Added global styling updates in `src/app/globals.css` to support the expanded auth/account and profile UI states.

## Milestone 3 - Admin Operations (Days 6-8)

### Day 6: Product Management CRUD

- Build admin product list/create/edit/delete.
- Support brand, model, specs, price, stock, category, image path.
- Use Zod validation in all admin write actions.
- Exit criteria: admin can fully manage product catalog.

### Day 7: Global Sales Utility

- Implement global discount toggle and percentage value.
- Implement category-specific discount overrides.
- Keep price calculation dynamic (no mass row updates).
- Exit criteria: discount changes reflect correctly on product prices.

### Day 8: Admin Order Management

- Admin order list and detail view.
- Update status (`PENDING`, `SHIPPED`, `DELIVERED`).
- Add audit-friendly status update timestamps.
- Exit criteria: admin can manage fulfillment lifecycle.

## Milestone 4 - Shop Experience (Days 9-11)

### Day 9: Product Listing and Detail

- Build storefront listing with category filter/search basics.
- Add product detail page with specs and price breakdown.
- Exit criteria: user can browse and inspect products.

### Day 10: Persistent Cart

- Implement cart actions (add/update/remove/clear).
- Persist cart items per authenticated user.
- Validate stock constraints at write time.
- Exit criteria: cart survives refresh and session continuity.

### Day 11: Checkout and Order Creation

- Build checkout form and order summary.
- Create transactional order from cart.
- Snapshot price/discount into `OrderItem`.
- Decrement stock and clear cart after successful order.
- Exit criteria: successful end-to-end purchase flow.

## Milestone 5 - User and Release Readiness (Days 12-14)

### Day 12: User Order History

- Build user order history list.
- Add order detail page with items, totals, status.
- Enforce owner/admin access checks.
- Exit criteria: users can view only their own orders.

### Day 13: Hardening and Performance

- Add route loading and error boundaries.
- Add cache/revalidation for catalog/admin updates.
- Add structured server logging for critical actions.
- Exit criteria: no major UX blockers and stable error handling.

### Day 14: QA + Deployment Prep

- Run lint/type-check and fix all blockers.
- Validate critical manual test cases (RBAC, checkout, discounts, order status).
- Set backup policy for same-server database.
- Exit criteria: project is deployment-ready.

## Daily Working Rule

- Start each day by moving one checklist group to "In Progress".
- End each day by documenting:
  - What was completed,
  - What is blocked,
  - What will be done next day.

## Security Gates (Must Pass Before Release)

- All mutation actions use input validation at boundary.
- Admin-only actions are role-protected server-side.
- No raw SQL string concatenation.
- Checkout uses transaction and stock revalidation.
