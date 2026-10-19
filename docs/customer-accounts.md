# Customer accounts

The storefront uses the existing managed Neon Auth service through its official Next.js SDK. Customer accounts are separate from the private seller account at `/admin`; signing up as a shopper grants no seller permissions.

- `/login`: email/password login, password visibility toggle, Google sign-in, and a signup link.
- `/signup`: name, email, password (at least 12 characters), password confirmation, and Google sign-in.
- `/account`: authenticated account and order history, links to protected receipts, and sign-out.
- `/forgot-password` and `/reset-password`: managed email reset links and new-password entry. The request screen uses the same confirmation for existing and unknown emails.

Login and signup preserve a checkout destination. Return destinations are restricted to local account, checkout, and order paths. Session cookies are HttpOnly and managed by Neon Auth. The server uses a signed, 60-second session cache. The account proxy handles OAuth session verification and refresh; private reads also check the customer session.

## Configuration

Required environment variables:

```text
NEON_AUTH_BASE_URL=<the existing branch Auth URL>
NEON_AUTH_COOKIE_SECRET=<a random secret of at least 32 characters>
```

Keep both the signing secret and all environment files out of Git. `NEON_AUTH_COOKIE_SECRET` must be configured in each Vercel environment where customer authentication runs. Production has its own sensitive Vercel variable.

The auth provider's trusted origins must include `https://zylo-delta.vercel.app`. This deployment also permits the exact local test origin `http://127.0.0.1:3100`; the provider's localhost setting permits `http://localhost:3000`. Additional custom domains require their own explicit entries. Do not add a wildcard origin.

Google provider credentials and branding are managed in Neon Console → Auth. Google returns to `{NEON_AUTH_BASE_URL}/callback/google`; after authorization, Neon returns the session to `/account` on the application's origin. Google’s actual account selection/consent is performed by the shopper. For a production app using its own Google branding, configure its own Google OAuth client in Neon. See the [Neon OAuth guide](https://neon.com/docs/auth/guides/setup-oauth) and [Next.js integration](https://github.com/neondatabase/neon-js/blob/main/packages/auth/NEXT-JS.md).

Before deploying the account integration, apply the additive migration:

```sh
pnpm db:migrate:customers
```

## Customer order ownership

Signed-in checkout obtains the user ID from the server session and stores it in `orders.customer_id`; IDs provided in a request body are ignored. Checkout prefills the customer's name and email. Guest checkout stays available.

An account can see orders created with its user ID. A verified email can also recover matching guest orders. Unverified email signup does not expose historical guest orders merely because someone entered the same email. Individual receipt access accepts an existing receipt cookie, the matching authenticated customer, a verified matching email, or the store owner. The existing guest tracking flow remains available.

## Verification

The regular browser suite includes the white reference layout, password visibility, signup confirmation validation, preserved checkout navigation, mobile sizing, private account redirects, and invalid reset links.

The managed-provider integration test is explicit opt-in because it creates one synthetic account in the configured Auth service. Orders go only to the isolated `zylo_dashboard_test_*` database. Cleanup deletes only that exact random account ID and its synthetic `@zylo-test.invalid` email from the configured Auth database, as the provider does not expose a self-delete endpoint.

```sh
# Start the isolated database-backed app on the provider's default local origin.
node --import ./scripts/test-env.mjs node_modules/next/dist/bin/next dev --hostname localhost --port 3000

# In another terminal:
PLAYWRIGHT_BASE_URL=http://localhost:3000 RUN_MANAGED_AUTH_TESTS=1 pnpm exec playwright test tests/customer-auth.spec.ts tests/customer-session.spec.ts
```

For recurring automated provider tests, use a separate Neon Auth branch and matching database credentials. The integration journey checks signup, persistent sessions, wrong-password handling, re-login, checkout prefilling, server-assigned order ownership, account isolation from guest orders and seller exports, receipt access without a guest cookie, sign-out, a real Google authorization redirect, and the generic reset-link request response.
