# Hybrid Commerce Implementation

## Purpose

Evercrafted now supports two deliberately different customer purchase paths within one Moodoor catalogue. **Enquiry-first** preserves the bespoke conversation appropriate to limited, made-to-order, or custom-fit wreaths. **Direct checkout** is reserved for maker-approved, quality-passed, available designs that have a managed-commerce product variant assigned.

> A marketplace publication does not release a wreath to Moodoor, and a Moodoor release does not automatically create a purchase path. These are three separate maker decisions: marketplace publication, Moodoor release, and commerce mode.

| Decision | Maker control | Customer result | Private data boundary |
|---|---|---|---|
| Enquiry first | `commerce.mode = enquiry` | Availability-request email action | No provider or variant data is exposed. |
| Direct checkout | `commerce.mode = direct_checkout` with a Shopify variant ID | “Purchase securely” creates a managed hosted checkout session | The public API exposes only `commerce.mode`; variant ID, token, and store configuration stay server-side. |

## Data Model

New listings use `marketplace_listing.v3`; prior v2 records remain valid because an absent `commerce` field resolves to **enquiry**. Moodoor projections use `moodoor_public_listing.v2`; the public field is intentionally narrowed to the customer's capability state.

```ts
// Private canonical marketplace record
commerce:
  | { mode: 'enquiry'; provider: null; variantId: null }
  | { mode: 'direct_checkout'; provider: 'shopify'; variantId: string }

// Public Moodoor listing projection
commerce: { mode: 'enquiry' | 'direct_checkout' }
```

The server creates the provider cart only after it verifies all of the following: the public projection still exists, the listing remains marketplace-published and Moodoor-released, the listing is not unavailable, and the canonical record still has a valid direct-checkout configuration. The browser receives only a hosted `checkoutUrl` and redirects to the managed checkout.

## Managed Checkout Configuration

The active application requires these **server-only** deployment variables for the direct-checkout branch. Do not place these values in a Vite client variable or commit them to source control.

| Variable | Purpose |
|---|---|
| `SHOPIFY_STOREFRONT_DOMAIN` | Store domain without protocol, for example `store.example.myshopify.com`. |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Private Storefront API token with the minimal permissions required to create a cart. |
| `SHOPIFY_STOREFRONT_API_VERSION` | Optional Shopify Storefront API version; the implementation defaults to `2026-07`. |

The implementation calls Shopify’s `cartCreate` mutation with one approved product variant and returns Shopify’s hosted `checkoutUrl`. Shopify documents that carts are created against Storefront API product variants, and that a checkout URL should be requested when the buyer is ready to navigate to checkout.[1] The cart secret and all provider credentials remain server-only.[1]

## Activation Sequence

1. In Shopify, enable Storefront API access for the production storefront and create a private access token. Shopify’s current documentation describes this through the Headless channel and its Storefront API permissions.[2]
2. Add the three server-only variables to the production hosting environment.
3. Create the matching Shopify product and product variant for a ready-to-ship Evercrafted listing.
4. In Order Studio, select **Direct checkout** and paste the private product variant ID. Use **Enquiry first** for bespoke, limited, or otherwise conversational pieces.
5. Save the canonical listing, pass the existing 0.78 quality gate, publish it, and deliberately release it in Moodoor Studio.
6. Test a real checkout in a non-production product before enabling the same mode for a live piece.

Until the three variables are present, a direct-checkout listing **fails closed** with `503 CHECKOUT_NOT_CONFIGURED`; the customer sees a clear message to request availability rather than a broken checkout. Enquiry listings always reject the checkout endpoint with `409 ENQUIRY_ONLY_LISTING`.

## Validation Coverage

`npm run test:moodoor-public-api` verifies that public browse, detail, and match results reveal the commerce mode but exclude provider variant IDs, private inventory quantities, and supplier data. It also verifies that enquiry listings cannot create direct checkout and that direct checkout fails safely when deployment configuration is absent.

## References

[1] [Shopify, “Create and update a cart with the Storefront API.”](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage)

[2] [Shopify, “Getting started with the Storefront API.”](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started)
