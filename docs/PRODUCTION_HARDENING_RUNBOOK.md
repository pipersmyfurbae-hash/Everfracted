# Production Hardening Runbook

## Objective

This runbook moves the completed maker, Moodoor, and hybrid-commerce work from a validated application state to a controlled production rollout. The order is intentional: first protect the data boundary, then backfill compatible records, then observe the customer endpoints, and only then activate direct checkout.

> **Do not deploy Firestore rules, execute the data migration, or activate Shopify checkout simultaneously.** Each step has a distinct verification point and a reversible response.

| Release step | Change | Success condition | Rollback response |
|---|---|---|---|
| 1 | Deploy the staged Firestore policy | Browser clients can use their own inventory and private blueprints but cannot write marketplace or public projection documents. | Re-deploy the prior reviewed rules revision. |
| 2 | Dry-run hybrid record migration | Reported document counts are expected and sampled records preserve all existing fields. | No action; dry-run is read-only. |
| 3 | Apply hybrid record migration | Every migrated listing has explicit `commerce` and current schema markers; original documents appear in backups. | Run the migration with `--rollback`. |
| 4 | Observe public APIs and limits | Catalogue, matching, and detail traffic behave normally; 429 responses appear only under expected abusive patterns. | Raise limits temporarily with an environment variable, then investigate. |
| 5 | Configure Shopify private variables | A non-production listing completes a managed checkout through the provider. | Remove the private variables; direct checkout fails closed and directs customers to enquiry. |

## 1. Firestore Rules Promotion

The repository keeps the reviewed policy in `firestore.rules.next`. It intentionally makes `marketplace_listings` and `moodoor_public_listings` server-authoritative: customers never receive raw inventory quantities, supplier information, costs, margins, or source score components. The Admin SDK used by the server is not constrained by client Firestore rules; browser SDK access is.

Before promotion, test the policy in a non-production Firebase project or Emulator Suite with the following matrix.

| Actor | Resource | Expected result |
|---|---|---|
| Anonymous visitor | `moodoor_public_listings` | Denied; public API remains the only reader. |
| Signed-in maker | Own inventory / own blueprint | Allowed within the ownership checks. |
| Signed-in maker | `marketplace_listings` direct write | Denied; maker API is required. |
| Signed-in maker | `moodoor_public_listings` direct write | Denied; release API is required. |
| Signed-in customer | Another maker’s private blueprint | Denied. |
| Administrator | Canonical operational records | Allowed when the configured admin condition is satisfied. |

After validation, copy the staged file to the deployment target and deploy it using the team’s existing Firebase project configuration. The precise production project identifier is intentionally not embedded in source control.

```bash
cp firestore.rules.next firestore.rules
firebase deploy --only firestore:rules
```

Commit the resulting reviewed rules revision only after the deployment owner confirms success. A deploy changes the live authorization boundary and therefore requires an explicit production approver.

## 2. Hybrid Commerce Migration

The migration is **additive**, **idempotent**, and **reversible**. It adds explicit enquiry defaults to legacy listings and updates schema markers without deleting or renaming existing fields. Before each first mutation, it stores the original full document under `migration_backups/hybrid-commerce-v1/documents`.

```bash
# Uses application-default credentials. This is read-only.
npx tsx scripts/migrate-hybrid-commerce.ts

# Applies explicit commerce defaults and schema-version updates.
npx tsx scripts/migrate-hybrid-commerce.ts --apply

# Restores all original documents from the retained migration backup.
npx tsx scripts/migrate-hybrid-commerce.ts --rollback
```

Sampling after `--apply` should verify the following properties. Legacy listings must receive `{ mode: 'enquiry', provider: null, variantId: null }`. Existing valid direct-checkout records retain their Shopify product variant ID only in the canonical listing. Public projection records contain just `{ mode: 'enquiry' | 'direct_checkout' }`.

## 3. Rate Limits and Operations

The server applies privacy-preserving, Firestore-backed fixed-window rate limits to anonymous endpoints. The key uses a SHA-256 hash of the request client address; raw addresses are not stored. Limits can be adjusted at deployment time without a code change.

| Variable | Default | Endpoint class |
|---|---:|---|
| `MOODOOR_MATCHES_PER_MINUTE` | 60 | `POST /api/v1/moodoor/matches` |
| `MOODOOR_CATALOGUE_PER_MINUTE` | 120 | Public browse and listing detail |
| `MOODOOR_CHECKOUTS_PER_MINUTE` | 20 | Managed checkout session creation |

Any `429 RATE_LIMITED` response includes `Retry-After`, plus `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers. The system falls back to in-memory throttling if the shared rate-limit store is temporarily unavailable; this maintains a protective bound rather than opening an unlimited path. For multiregion operation, monitor the `api_rate_limits` collection and configure a Firestore TTL policy on `expiresAt` to remove expired buckets automatically.

## 4. Managed Checkout Activation

Direct checkout is deployed but intentionally inactive until private Shopify Storefront API configuration is supplied. The disabled connector was not activated during this build, so no customer is redirected to a real payment flow without an approved store configuration.

Set these variables in the server runtime only, then complete a non-production checkout test:

```bash
SHOPIFY_STOREFRONT_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=private_storefront_token
SHOPIFY_STOREFRONT_API_VERSION=2026-07
```

If configuration is absent or the provider request cannot create a cart, the API returns a customer-safe error and the listing retains its enquiry option. Never expose a product variant ID, private access token, supplier record, or inventory quantity in the browser.

## 5. Release Evidence

Before declaring the rollout complete, attach the successful output of the following checks to the deployment record.

```bash
npm run lint
npm run test:ecosystem
npm run build
```

The suite covers the 0.78 Moodoor quality eligibility threshold, deterministic formula and placement behavior, public projection privacy, direct-checkout fail-closed behavior, and anonymous API throttling.
