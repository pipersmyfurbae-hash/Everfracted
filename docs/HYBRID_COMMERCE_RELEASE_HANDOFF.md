# Evercrafted Hybrid Commerce Release Handoff

**Status:** Application implementation and automated validation complete. **Live managed checkout is intentionally inactive** until a production owner supplies Shopify’s server-only configuration and completes a non-production transaction test.

## 1. Delivered Operating Model

Evercrafted now supports two distinct commercial paths without compromising the Moodoor catalogue’s editorial experience or its privacy boundary. An eligible, available, deliberately released wreath may either remain **enquiry-first** or be configured for **managed direct checkout**. Marketplace publication, Moodoor release, and the selection of a commerce mode remain separate maker decisions.

| Customer path | Intended use | Public capability | Server-side behaviour |
|---|---|---|---|
| **Enquiry first** | Bespoke, limited, made-to-order, or conversational designs | The customer can request availability through their email client. | No provider identifier, product variant, cost, supplier, or stock quantity is returned. |
| **Managed direct checkout** | Ready-to-ship designs that a maker has explicitly linked to an approved Shopify variant | The customer can select **Purchase securely**. | The server verifies current eligibility, creates a Shopify Storefront cart, and returns only the hosted checkout URL. |

> A direct checkout configuration does **not** publish a listing to the marketplace or Moodoor. A marketplace publication does **not** make a listing Moodoor-visible. The existing **0.78** Moodoor quality threshold remains mandatory.

## 2. Implementation Boundaries

The server owns the canonical marketplace record, the public Moodoor projection, checkout eligibility, Shopify variant reference, and Storefront API token. The customer browser receives only public title, narrative, imagery, price, availability, tags, and a narrow `commerce.mode` capability state. The direct-checkout endpoint rechecks marketplace publication, Moodoor release, availability, and managed-commerce configuration immediately before it creates a provider cart.

| Area | Delivered control |
|---|---|
| **Catalogue and matching** | Public browse, detail, and match routes read only `moodoor_public_listings`. |
| **Privacy** | Public responses exclude raw inventory, supplier information, costs, margins, score components, and Shopify variant IDs. |
| **Checkout** | `POST /api/v1/moodoor/listings/:slug/checkout` is available only for an eligible `direct_checkout` listing. |
| **Failure mode** | Missing Shopify configuration returns a customer-safe `503 CHECKOUT_NOT_CONFIGURED`; enquiry-only listings return `409 ENQUIRY_ONLY_LISTING`. |
| **Abuse protection** | The public catalogue, matching, detail, and checkout routes use privacy-preserving rate limits with `429` and `Retry-After` responses. |
| **Legacy data** | The hybrid migration adds defaults rather than replacing old fields, is idempotent, and retains document backups for rollback. |

## 3. Validation Record

The restored production branch is synchronized at commit `0d36585` and contains the following checkpoints.

| Commit | Delivery |
|---|---|
| `80182f6` | Canonical schemas, secure APIs, deterministic placement, and maker workflow |
| `94a2dc9` | Public Moodoor catalogue and enquiry journey |
| `8bc6f0a` | Hybrid enquiry and managed Shopify checkout flow |
| `0d36585` | Public rate limiting, additive migration, and production hardening runbook |

On 2026-08-25, the complete validation command succeeded:

```bash
npm run lint && npm run build && npm run test:ecosystem
```

The test suite verifies deterministic composition and the 0.78 quality boundary, customer-safe Moodoor projections, public route validation, managed-checkout fail-closed behaviour, enquiry-only rejection, rate limiting, placement reproducibility, and maker-workflow quality reporting.

## 4. Production Activation Sequence

Use the following order. Each stage is separable and reversible; do not combine a Firestore policy deployment, record migration, and first production checkout activation into one release event.

| Stage | Owner action | Verification | Rollback |
|---|---|---|---|
| **1. Policy** | Validate and deploy `firestore.rules.next` through the existing Firebase release process. | Browser clients cannot directly write canonical marketplace or Moodoor projection records. | Re-deploy the prior reviewed rules revision. |
| **2. Dry-run migration** | Run `npx tsx scripts/migrate-hybrid-commerce.ts`. | Counts and sampled documents preserve original fields. | None required; the dry run is read-only. |
| **3. Apply migration** | Run `npx tsx scripts/migrate-hybrid-commerce.ts --apply`. | Legacy listings receive explicit enquiry defaults and current schema markers. | Run the same script with `--rollback`. |
| **4. Observe public APIs** | Monitor rate-limit and endpoint behaviour before exposing direct checkout. | Expected catalogue and match traffic; no unexpected 429 volume. | Adjust deployment-time thresholds and investigate abuse patterns. |
| **5. Activate checkout** | Configure Shopify secrets; test a non-production product; then enable a single ready-to-ship listing. | Hosted checkout opens from the eligible listing and returns to Shopify’s standard payment flow. | Remove server-only Shopify variables or return the listing to enquiry mode. |

## 5. Shopify Activation Prerequisites

The Shopify connector was not activated because the activation request was declined. This does not block the application code, but it means no live provider configuration was inspected or changed. A deployment owner must provide the following as **server-only** environment values; never use a Vite-prefixed client variable and never commit them to source control.

```bash
SHOPIFY_STOREFRONT_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=private_storefront_token
SHOPIFY_STOREFRONT_API_VERSION=2026-07
```

Create a product and matching product variant in Shopify for each ready-to-ship direct-checkout listing. In Order Studio, select **Direct checkout**, enter the private variant ID, save the listing, satisfy the quality and marketplace gates, then deliberately release it in Moodoor Studio. Until these values are configured, the application deliberately preserves the enquiry fallback.

> Shopify’s Storefront API supports creating a cart with product variants and returning the hosted checkout URL when the buyer is ready to check out. The design keeps that provider interaction entirely on the server. [1]

## 6. Reference Documents

The detailed implementation and operational materials are available in the repository:

| Document | Purpose |
|---|---|
| `docs/HYBRID_COMMERCE_IMPLEMENTATION.md` | Commerce data model, endpoint behaviour, and configuration requirements |
| `docs/PRODUCTION_HARDENING_RUNBOOK.md` | Firestore promotion, migration, rate limits, and rollback procedure |
| `docs/ORDER_STUDIO_VISUAL_QA.md` | Local visual inspection findings and authentication constraints |
| `docs/ECOSYSTEM_ARCHITECTURE_AND_DELIVERY.md` | Original delivery boundary and lifecycle architecture |

## References

[1] [Shopify, *Create and update a cart with the Storefront API*](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage)
