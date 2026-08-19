import type { EcosystemTier } from './ecosystemContracts';

/** Legacy pro/enterprise values are normalized during the staged user-profile migration. */
export type Tier = EcosystemTier | 'pro' | 'enterprise';

export interface TierLimits {
  designsPerMonth: number;
  canExportSVG: boolean;
  canExportPrompt: boolean;
  canSell: boolean;
  hasInventoryWeaver: boolean;
  hasDesignStudio: boolean;
  hasCreatorUpload: boolean;
  hasAdvancedAI: boolean;
}

const FREE: TierLimits = {
  designsPerMonth: 0,
  canExportSVG: false,
  canExportPrompt: false,
  canSell: false,
  hasInventoryWeaver: false,
  hasDesignStudio: false,
  hasCreatorUpload: false,
  hasAdvancedAI: false,
};

const BLOOM: TierLimits = {
  ...FREE,
  designsPerMonth: 2,
};

const CRAFT: TierLimits = {
  ...BLOOM,
  designsPerMonth: 50,
  canExportSVG: true,
  canExportPrompt: true,
  hasInventoryWeaver: true,
};

const STUDIO: TierLimits = {
  ...CRAFT,
  designsPerMonth: Infinity,
  canSell: true,
  hasDesignStudio: true,
  hasCreatorUpload: true,
};

const ATELIER: TierLimits = {
  ...STUDIO,
  hasAdvancedAI: true,
};

export const TIER_CONFIG: Record<Tier, TierLimits> = {
  free: FREE,
  bloom: BLOOM,
  craft: CRAFT,
  studio: STUDIO,
  atelier: ATELIER,
  // Backwards-compatible aliases for profiles created before the v2 tier model.
  pro: ATELIER,
  enterprise: ATELIER,
};

export function normalizeTier(tier: string | null | undefined): EcosystemTier {
  if (tier === 'pro' || tier === 'enterprise') return 'atelier';
  if (tier === 'bloom' || tier === 'craft' || tier === 'studio' || tier === 'atelier') return tier;
  return 'free';
}

export function checkFeatureAccess(tier: Tier, feature: keyof TierLimits): boolean {
  const access = TIER_CONFIG[tier]?.[feature];
  return typeof access === 'boolean' ? access : false;
}

export function checkUsageLimit(currentUsage: number, tier: Tier): boolean {
  return currentUsage < TIER_CONFIG[tier].designsPerMonth;
}
