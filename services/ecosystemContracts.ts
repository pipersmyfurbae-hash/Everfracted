import type { MarketplaceCommerce, PublicCommerce } from './commerceMode';

export const ECOSYSTEM_SCHEMA = {
  user: 'everfracted_user.v2',
  marketplaceListing: 'marketplace_listing.v3',
  marketplaceListingLegacy: 'marketplace_listing.v2',
  moodoorPublicListing: 'moodoor_public_listing.v2',
  moodoorPublicListingLegacy: 'moodoor_public_listing.v1',
  moodoorPublicationEvent: 'moodoor_publication_event.v1',
} as const;

export type EcosystemTier = 'free' | 'bloom' | 'craft' | 'studio' | 'atelier';
export type EcosystemRole = 'admin' | 'maker' | 'client';
export type MarketplaceStatus = 'draft' | 'published' | 'archived';
export type AvailabilityStatus = 'in_stock' | 'limited' | 'unavailable';
export type MoodoorPublicationStatus = 'private' | 'published' | 'unpublished' | 'revoked';
export type QualityStatus = 'pass' | 'repair_needed' | 'unknown';

export interface UserProfileV2 {
  schemaVersion: typeof ECOSYSTEM_SCHEMA.user;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: EcosystemRole;
  tier: EcosystemTier;
  subscription: {
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none';
    provider: 'none' | 'commerce_adapter';
    currentPeriodEndsAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QualityAssessmentV2 {
  score: number | null;
  status: QualityStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  warnings: string[];
}

export interface MarketplacePublicMetadataV2 {
  title: string;
  summary: string;
  heroImageUrl: string | null;
  price: { amount: number | null; currency: 'USD' };
  moodTags: string[];
  seasonTags: string[];
  paletteTags: string[];
  formula: string | null;
}

export interface MarketplaceListingV3 {
  schemaVersion: typeof ECOSYSTEM_SCHEMA.marketplaceListing;
  listingId: string;
  creatorId: string;
  marketplace: {
    status: MarketplaceStatus;
    publishedAt: string | null;
  };
  quality: QualityAssessmentV2;
  availability: {
    status: AvailabilityStatus;
    updatedAt: string;
  };
  moodoor: {
    status: MoodoorPublicationStatus;
    publishedAt: string | null;
    publishedBy: string | null;
  };
  public: MarketplacePublicMetadataV2;
  /** Private provider identifiers are never copied to Moodoor projections. */
  commerce: MarketplaceCommerce;
  blueprintRef: {
    blueprintId: string;
    revision: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MoodoorPublicListingV2 {
  schemaVersion: typeof ECOSYSTEM_SCHEMA.moodoorPublicListing;
  listingId: string;
  slug: string;
  title: string;
  summary: string;
  heroImageUrl: string | null;
  price: { amount: number | null; currency: 'USD' };
  availability: Extract<AvailabilityStatus, 'in_stock' | 'limited'>;
  /** Only the customer-facing purchase mode is projected. */
  commerce: PublicCommerce;
  formula: string | null;
  moodTags: string[];
  seasonTags: string[];
  paletteTags: string[];
  publishedAt: string;
  sourceVersion: {
    listingSchema: typeof ECOSYSTEM_SCHEMA.marketplaceListing;
    listingUpdatedAt: string;
  };
}

export interface MoodoorPublicationEventV1 {
  schemaVersion: typeof ECOSYSTEM_SCHEMA.moodoorPublicationEvent;
  listingId: string;
  actorId: string;
  action: 'published' | 'unpublished' | 'revoked';
  occurredAt: string;
  reason: string | null;
  sourceRevision: number | null;
}

export function isStudioTierOrHigher(tier: EcosystemTier): boolean {
  return tier === 'studio' || tier === 'atelier';
}

export function canPublishToMoodoor(listing: Pick<MarketplaceListingV3, 'marketplace' | 'quality' | 'availability'>): boolean {
  return listing.marketplace.status === 'published'
    && listing.availability.status !== 'unavailable'
    && (listing.quality.status === 'pass' || (listing.quality.score !== null && listing.quality.score >= 0.78));
}
