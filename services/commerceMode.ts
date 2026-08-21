export const COMMERCE_MODES = ['enquiry', 'direct_checkout'] as const;
export type CommerceMode = typeof COMMERCE_MODES[number];
export type CommerceProvider = 'shopify';

/**
 * This record remains in the private canonical marketplace listing. Variant IDs
 * and provider configuration never belong in public Moodoor projections.
 */
export type MarketplaceCommerce =
  | { mode: 'enquiry'; provider: null; variantId: null }
  | { mode: 'direct_checkout'; provider: CommerceProvider; variantId: string };

export type PublicCommerce = {
  mode: CommerceMode;
};

function asTrimmedString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength ? value.trim() : null;
}

export function normalizeMarketplaceCommerce(value: unknown): MarketplaceCommerce | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const mode = candidate.mode;

  if (mode === 'enquiry') {
    return { mode: 'enquiry', provider: null, variantId: null };
  }

  if (mode === 'direct_checkout' && candidate.provider === 'shopify') {
    const variantId = asTrimmedString(candidate.variantId, 256);
    if (variantId) return { mode: 'direct_checkout', provider: 'shopify', variantId };
  }

  return null;
}

export function toPublicCommerce(value: unknown): PublicCommerce {
  if (value && typeof value === 'object' && (value as Record<string, unknown>).mode === 'direct_checkout') {
    return { mode: 'direct_checkout' };
  }
  return { mode: 'enquiry' };
}

export function isShopifyCheckoutCommerce(value: unknown): value is Extract<MarketplaceCommerce, { mode: 'direct_checkout' }> {
  return normalizeMarketplaceCommerce(value)?.mode === 'direct_checkout';
}
