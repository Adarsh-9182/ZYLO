# Zylo Business

The owner dashboard is available at `/admin`. It uses the same PostgreSQL catalog and orders as the storefront. It contains no sample revenue, customers or orders.

## What the owner can do

- **Overview:** sales, orders, unique customer emails, active listings, stock alerts, daily sales, bestsellers, recent orders and outstanding COD collections. The dashboard refreshes every minute while visible.
- **Products:** create and edit listings, selling prices in whole INR, display discounts, SKU, categories, tags, delivery and return information. Upload a JPG, PNG or WebP cover image up to 2 MB, or provide public image URLs. Gallery supports up to eight URLs. Publish or archive a listing.
- **Inventory:** available units, low-stock and out-of-stock lists, signed stock adjustments with reasons, and an inventory movement history. Orders reserve stock automatically.
- **Orders:** search by reference, customer, phone or product; filter fulfillment and payment states; see the full order, delivery address and purchased product snapshots; record courier, tracking, internal notes, collection and refund status; print a packing slip.
- **Customers:** contact details, order count, total ordered and the customer's complete buying history, grouped by normalized email address.
- **Analytics:** 7, 30 or 90 calendar days in India Standard Time, sales excluding cancellations/returns, net recorded collections, average order value, returns and bestselling products.
- **Settings:** store name, public support contact, business address, stock alert threshold, delivery charge/free-delivery threshold, password changes and store activity history.
- **CSV:** authenticated downloads of orders, products, inventory and customers, with spreadsheet formula protection. Exports include up to 10,000 records.

## Owner access

There is one store owner. There is no public administrator registration and no default password.

```sh
pnpm db:migrate:orders
pnpm db:migrate:admin
pnpm admin:setup
```

The setup command writes a private, git-ignored `OWNER-SETUP.md` containing a one-time link valid for seven days. Open it and choose your email and a password of at least 12 characters. Running the command cannot replace an existing owner's password. An unused setup link can be rotated by running the command again.

Owner passwords use salted scrypt hashes. Sessions are random, stored as hashes in PostgreSQL, expire after 12 hours and use HttpOnly, SameSite cookies (Secure in production). Logout revokes the session; changing the password revokes all previous sessions. Every private read, mutation and CSV download checks the session independently. Login, setup, checkout and customer order lookup are rate limited in the database.

## Order and inventory rules

The initial payment method is **cash on delivery**. No online payment gateway is connected. Marking an order paid records a collection; it does not charge a card. Marking it refunded records a refund that the business has already arranged; it does not move money automatically.

Fulfillment follows:

```
placed → confirmed → packed → shipped → delivered
   └─────────────── cancel ─┘            │
                             return ←───┘
```

Placed, confirmed and packed orders can be cancelled. Shipped and delivered orders can be returned. Cancellation and return are terminal and restore stock exactly once. This version handles whole-order cancellation/return, rather than individual-line returns. Tracking information is visible to the customer; internal notes are private.

Checkout reads prices and delivery rules from the database. It locks requested product rows in ID order and creates the order, item snapshots, stock reservation and movement history in one atomic SQL statement. A client-generated request key makes retries idempotent. Reusing a key for different checkout details is rejected.

Product editing uses version checks to avoid overwriting another tab's changes. Archiving removes a product from storefront queries, direct product pages and checkout. It preserves past orders and inventory history. Product edits and store settings invalidate storefront pages.

Customers can view their receipt using the browser that placed the order, or verify the reference and checkout email at `/track-order`. A reference by itself does not expose the delivery address.

## Database and media

Production needs `DATABASE_URL`. Pull the existing project's environment with `vercel env pull .env.local --environment=production` when working locally. Never commit environment files or setup links.

`db:migrate:admin` applies `scripts/migrate-admin.sql` transactionally. It adds dashboard tables/columns and keeps existing products, reviews and orders. The baseline catalog's dollar-source price representation remains internal; the editor and checkout agree on the rounded whole-rupee selling price.

Small uploaded cover images are stored in the database and served from immutable `/media/<uuid>` URLs. Uploaded images are public product assets. For a much larger image library, move these media records to object storage behind the same URLs.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
```

Browser tests require a separate PostgreSQL database named `zylo_dashboard_test_*`. Put its `DATABASE_URL` in the ignored `.env.dashboard-test`, then:

```sh
pnpm test:db:setup
pnpm exec playwright install chromium
pnpm test:dev            # terminal 1: isolated local server on port 3100
pnpm test:e2e            # terminal 2
```

Both fixtures and tests refuse to run against a database without that test prefix. Tests cover unauthorized access, real product creation and cover upload, storefront checkout, idempotent retries, customer receipt access, fulfillment, returns and stock restoration, archival, customer history, CSV export, mobile navigation, concurrent last-item ordering, stock adjustment limits, shipping rules and stale edits.
