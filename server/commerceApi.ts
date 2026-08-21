import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { isShopifyCheckoutCommerce } from '../services/commerceMode.ts';
import { sendApiError } from './apiAuth.ts';
import { createPublicRateLimit, perMinuteLimit } from './publicRateLimit.ts';

type ShopifyCartResponse = {
  data?: {
    cartCreate?: {
      cart?: { checkoutUrl?: string | null } | null;
      userErrors?: Array<{ message?: string }>;
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

function asPublicCheckoutConfig(): { domain: string; accessToken: string; apiVersion: string } | null {
  const domain = process.env.SHOPIFY_STOREFRONT_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const accessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION?.trim() || '2026-07';
  return domain && accessToken ? { domain, accessToken, apiVersion } : null;
}

async function createShopifyCheckout(variantId: string): Promise<string | null> {
  const config = asPublicCheckoutConfig();
  if (!config) return null;

  const response = await fetch(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.accessToken,
    },
    body: JSON.stringify({
      query: `mutation CreateMoodoorCart($input: CartInput!) {
        cartCreate(input: $input) {
          cart { checkoutUrl }
          userErrors { message }
        }
      }`,
      variables: { input: { lines: [{ quantity: 1, merchandiseId: variantId }] } },
    }),
  });

  const payload = await response.json().catch(() => null) as ShopifyCartResponse | null;
  if (!response.ok || !payload || payload.errors?.length || payload.data?.cartCreate?.userErrors?.length) {
    const message = payload?.errors?.[0]?.message || payload?.data?.cartCreate?.userErrors?.[0]?.message || `Shopify checkout request failed (${response.status}).`;
    throw new Error(message);
  }

  return payload.data?.cartCreate?.cart?.checkoutUrl || null;
}

/**
 * Public direct checkout is limited to a listing that the maker has explicitly
 * configured for managed commerce and deliberately released to Moodoor. The
 * server reads the private variant reference, creates a provider cart, and
 * returns only a short-lived hosted checkout URL to the browser.
 */
export function registerCommerceApi(app: Express, db: Firestore): void {
  const checkoutLimit = createPublicRateLimit(db, perMinuteLimit('moodoor_checkout', 20, 'MOODOOR_CHECKOUTS_PER_MINUTE'));
  app.post('/api/v1/moodoor/listings/:slug/checkout', checkoutLimit, async (req, res) => {
    try {
      const projectionSnapshot = await db.collection('moodoor_public_listings').where('slug', '==', req.params.slug).limit(1).get();
      if (projectionSnapshot.empty) {
        sendApiError(res, 404, 'LISTING_NOT_FOUND', 'This Moodoor wreath is no longer in the current edit.');
        return;
      }

      const projection = projectionSnapshot.docs[0].data();
      if (projection.commerce?.mode !== 'direct_checkout' || typeof projection.listingId !== 'string') {
        sendApiError(res, 409, 'ENQUIRY_ONLY_LISTING', 'This one is offered through a personal availability enquiry.');
        return;
      }

      const listingSnapshot = await db.collection('marketplace_listings').doc(projection.listingId).get();
      if (!listingSnapshot.exists) {
        sendApiError(res, 404, 'LISTING_NOT_FOUND', 'This Moodoor wreath is no longer in the current edit.');
        return;
      }

      const listing = listingSnapshot.data() || {};
      if (listing.status !== 'published' || listing.moodoorPublished !== true || listing.availability === 'unavailable' || !isShopifyCheckoutCommerce(listing.commerce)) {
        sendApiError(res, 409, 'CHECKOUT_UNAVAILABLE', 'Direct checkout is not currently available for this wreath.');
        return;
      }

      if (!asPublicCheckoutConfig()) {
        sendApiError(res, 503, 'CHECKOUT_NOT_CONFIGURED', 'Direct checkout is being prepared. Please request availability and we will be glad to assist.');
        return;
      }

      const checkoutUrl = await createShopifyCheckout(listing.commerce.variantId);
      if (!checkoutUrl) {
        sendApiError(res, 502, 'CHECKOUT_UNAVAILABLE', 'Direct checkout could not be prepared. Please request availability and we will be glad to assist.');
        return;
      }

      res.json({ checkoutUrl });
    } catch (error) {
      console.error('Moodoor managed checkout error:', error);
      sendApiError(res, 502, 'CHECKOUT_UNAVAILABLE', 'Direct checkout could not be prepared. Please request availability and we will be glad to assist.');
    }
  });
}
