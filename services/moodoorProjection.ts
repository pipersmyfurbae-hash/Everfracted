import {
  moodoorQualityThreshold,
  normalizeMoodoorText,
  type MoodoorListing,
} from './moodoorMatchingCore';

/**
 * Compatibility contract for marketplace records while the v2 canonical schema
 * is introduced. All public Moodoor representations must pass through this
 * adapter; callers never expose a raw marketplace record directly.
 */
export interface MarketplaceDocument extends Record<string, unknown> {
  name?: string;
  title?: string;
  description?: string;
  summary?: string;
  price?: number;
  status?: string;
  creatorId?: string;
  imageUrl?: string;
  image_url?: string;
  renderUrl?: string;
  formula?: string;
  emotionTags?: string[];
  emotionalTags?: string[];
  moodTags?: string[];
  seasons?: string[];
  season?: string;
  palette?: string[] | Record<string, string>;
  availability?: string;
  inventoryStatus?: string;
  qualityScore?: number;
  score?: number;
  scoreReport?: { total?: number; status?: string };
  qualityApproved?: boolean;
  moodoorPublished?: boolean;
  moodoorStatus?: string;
  createdAt?: { toDate?: () => Date };
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).filter((item): item is string => typeof item === 'string');
  return [];
}

export function resolveMoodoorAvailability(raw: MarketplaceDocument): MoodoorListing['availability'] {
  const value = normalizeMoodoorText(String(raw.availability || raw.inventoryStatus || 'in stock'));
  if (['out', 'out of stock', 'sold out', 'unavailable', 'discontinued'].some((term) => value.includes(term))) return 'unavailable';
  if (['low', 'limited', 'few remaining'].some((term) => value.includes(term))) return 'limited';
  return 'in_stock';
}

export function resolveMoodoorQuality(raw: MarketplaceDocument): MoodoorListing['quality'] {
  const score = typeof raw.qualityScore === 'number'
    ? raw.qualityScore
    : typeof raw.score === 'number'
      ? raw.score
      : typeof raw.scoreReport?.total === 'number'
        ? raw.scoreReport.total
        : null;
  const explicitApproval = raw.qualityApproved === true || normalizeMoodoorText(String(raw.scoreReport?.status || '')) === 'pass';
  return explicitApproval || (score !== null && score >= moodoorQualityThreshold) ? 'approved' : 'review_required';
}

export function isPublishedForMoodoor(raw: MarketplaceDocument): boolean {
  const marketplacePublished = normalizeMoodoorText(String(raw.status || '')) === 'published';
  const moodoorState = normalizeMoodoorText(String(raw.moodoorStatus || ''));
  return marketplacePublished && (raw.moodoorPublished === true || moodoorState === 'published');
}

/**
 * Convert a marketplace document into an eligible maker-visible candidate. It
 * must be published, quality-approved, and sellable, but it does not need a
 * Moodoor release yet.
 */
export function toMoodoorCandidate(id: string, raw: MarketplaceDocument): MoodoorListing | null {
  if (normalizeMoodoorText(String(raw.status || '')) !== 'published') return null;

  const listing: MoodoorListing = {
    id,
    title: String(raw.title || raw.name || 'Untitled wreath'),
    summary: String(raw.summary || raw.description || 'A published Evercrafted wreath selected for its botanical character and compositional clarity.'),
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : typeof raw.image_url === 'string' ? raw.image_url : typeof raw.renderUrl === 'string' ? raw.renderUrl : null,
    price: typeof raw.price === 'number' ? raw.price : null,
    currency: 'USD',
    seasonTags: asStringArray(raw.seasons || raw.season),
    moodTags: asStringArray(raw.moodTags || raw.emotionalTags || raw.emotionTags),
    paletteTags: asStringArray(raw.palette),
    formula: typeof raw.formula === 'string' ? raw.formula : null,
    availability: resolveMoodoorAvailability(raw),
    quality: resolveMoodoorQuality(raw),
    publishedAt: raw.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : null,
    isMoodoorPublished: raw.moodoorPublished === true || normalizeMoodoorText(String(raw.moodoorStatus || '')) === 'published',
  };

  if (listing.availability === 'unavailable' || listing.quality !== 'approved') return null;
  return listing;
}

/** Convert a deliberately released marketplace record into a public-safe listing. */
export function toMoodoorListing(id: string, raw: MarketplaceDocument): MoodoorListing | null {
  if (!isPublishedForMoodoor(raw)) return null;
  return toMoodoorCandidate(id, raw);
}
