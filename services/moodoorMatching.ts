import { collection, getDocs, query, updateDoc, where, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type MoodId = 'calm' | 'warm' | 'dramatic' | 'romantic' | 'natural' | 'festive';
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter' | 'occasion';
export type DoorId = 'dark-wood' | 'painted-light' | 'modern' | 'rustic' | 'neutral';

export interface MoodProfile {
  mood: MoodId;
  season: SeasonId;
  door: DoorId;
}

export interface MoodoorListing {
  id: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  seasonTags: string[];
  moodTags: string[];
  paletteTags: string[];
  formula: string | null;
  availability: 'in_stock' | 'limited' | 'unavailable';
  quality: 'approved' | 'review_required';
  publishedAt: string | null;
  isMoodoorPublished: boolean;
}

export interface MoodoorMatch {
  listing: MoodoorListing;
  score: number;
  explanation: string;
  matchedSignals: string[];
}

interface MarketplaceDocument extends Record<string, unknown> {
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

const MINIMUM_QUALITY_SCORE = 0.78;

const moodSignals: Record<MoodId, string[]> = {
  calm: ['calm', 'quiet', 'still', 'minimal', 'soft', 'serene', 'mist', 'ivory'],
  warm: ['warm', 'welcoming', 'golden', 'amber', 'hearth', 'cozy', 'rich'],
  dramatic: ['dramatic', 'bold', 'contrast', 'deep', 'sculptural', 'editorial'],
  romantic: ['romantic', 'soft', 'tender', 'blush', 'garden', 'velvet', 'rose'],
  natural: ['natural', 'organic', 'botanical', 'garden', 'wild', 'fresh', 'green'],
  festive: ['festive', 'holiday', 'evergreen', 'berry', 'celebration', 'winter'],
};

const doorSignals: Record<DoorId, string[]> = {
  'dark-wood': ['warm', 'golden', 'ivory', 'contrast', 'evergreen'],
  'painted-light': ['natural', 'green', 'blue', 'soft', 'contrast'],
  modern: ['minimal', 'sculptural', 'quiet', 'contrast', 'architectural'],
  rustic: ['natural', 'warm', 'garden', 'organic', 'harvest'],
  neutral: ['balanced', 'natural', 'soft', 'warm', 'calm'],
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).filter((item): item is string => typeof item === 'string');
  return [];
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]/g, ' ');
}

function hasAny(haystack: string[], signals: string[]): boolean {
  const searchable = haystack.map(normalize).join(' ');
  return signals.some((signal) => searchable.includes(normalize(signal)));
}

function listingText(listing: MoodoorListing): string[] {
  return [listing.title, listing.summary, listing.formula || '', ...listing.seasonTags, ...listing.moodTags, ...listing.paletteTags];
}

function resolveAvailability(raw: MarketplaceDocument): MoodoorListing['availability'] {
  const value = normalize(String(raw.availability || raw.inventoryStatus || 'in stock'));
  if (['out', 'out of stock', 'sold out', 'unavailable', 'discontinued'].some((term) => value.includes(term))) return 'unavailable';
  if (['low', 'limited', 'few remaining'].some((term) => value.includes(term))) return 'limited';
  return 'in_stock';
}

function resolveQuality(raw: MarketplaceDocument): MoodoorListing['quality'] {
  const score = typeof raw.qualityScore === 'number'
    ? raw.qualityScore
    : typeof raw.score === 'number'
      ? raw.score
      : typeof raw.scoreReport?.total === 'number'
        ? raw.scoreReport.total
        : null;
  const explicitApproval = raw.qualityApproved === true || normalize(String(raw.scoreReport?.status || '')) === 'pass';
  return explicitApproval || (score !== null && score >= MINIMUM_QUALITY_SCORE) ? 'approved' : 'review_required';
}

function isPublishedForMoodoor(raw: MarketplaceDocument): boolean {
  const marketplacePublished = normalize(String(raw.status || '')) === 'published';
  const moodoorState = normalize(String(raw.moodoorStatus || ''));
  return marketplacePublished && (raw.moodoorPublished === true || moodoorState === 'published');
}

export function toMoodoorCandidate(id: string, raw: MarketplaceDocument): MoodoorListing | null {
  if (normalize(String(raw.status || '')) !== 'published') return null;

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
    availability: resolveAvailability(raw),
    quality: resolveQuality(raw),
    publishedAt: raw.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : null,
    isMoodoorPublished: raw.moodoorPublished === true || normalize(String(raw.moodoorStatus || '')) === 'published',
  };

  if (listing.availability === 'unavailable' || listing.quality !== 'approved') return null;
  return listing;
}

export function toMoodoorListing(id: string, raw: MarketplaceDocument): MoodoorListing | null {
  if (!isPublishedForMoodoor(raw)) return null;
  return toMoodoorCandidate(id, raw);
}

export async function getMoodoorCatalog(): Promise<MoodoorListing[]> {
  const snapshot = await getDocs(query(collection(db, 'marketplace_listings'), where('status', '==', 'published')));
  return snapshot.docs
    .map((entry) => toMoodoorListing(entry.id, entry.data() as MarketplaceDocument))
    .filter((entry): entry is MoodoorListing => entry !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getCreatorMoodoorListings(creatorId: string): Promise<MoodoorListing[]> {
  const snapshot = await getDocs(query(collection(db, 'marketplace_listings'), where('creatorId', '==', creatorId)));
  return snapshot.docs
    .map((entry) => toMoodoorCandidate(entry.id, entry.data() as MarketplaceDocument))
    .filter((entry): entry is MoodoorListing => entry !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function setMoodoorPublication(listingId: string, publish: boolean): Promise<void> {
  await updateDoc(doc(db, 'marketplace_listings', listingId), {
    moodoorPublished: publish,
    moodoorStatus: publish ? 'published' : 'unpublished',
    moodoorUpdatedAt: serverTimestamp(),
  });
}

export function rankMoodoorMatches(profile: MoodProfile, catalog: MoodoorListing[]): MoodoorMatch[] {
  const ranked = catalog
    .filter((listing) => listing.availability !== 'unavailable' && listing.quality === 'approved')
    .map((listing) => {
      const text = listingText(listing);
      const signals: string[] = [];
      let score = 0.22;

      if (hasAny(text, moodSignals[profile.mood])) {
        score += 0.34;
        signals.push(`${profile.mood} mood`);
      }
      if (hasAny(listing.seasonTags, [profile.season]) || hasAny(text, [profile.season])) {
        score += 0.22;
        signals.push(`${profile.season} fit`);
      }
      if (hasAny(text, doorSignals[profile.door])) {
        score += 0.16;
        signals.push(`${profile.door.replace('-', ' ')} compatibility`);
      }
      if (listing.availability === 'in_stock') {
        score += 0.06;
        signals.push('in stock');
      } else if (listing.availability === 'limited') {
        score += 0.03;
        signals.push('limited availability');
      }

      const explanation = signals.length
        ? `${listing.title} was selected for its ${signals.slice(0, 3).join(', ')}.`
        : `${listing.title} is a balanced, available option from the current Moodoor edit.`;
      return { listing, score: Math.min(1, score), explanation, matchedSignals: signals };
    })
    .filter((match) => match.score >= 0.42)
    .sort((a, b) => b.score - a.score || a.listing.title.localeCompare(b.listing.title));

  const seenFormulae = new Set<string>();
  return ranked.filter((match) => {
    const formula = normalize(match.listing.formula || match.listing.title);
    if (seenFormulae.has(formula)) return false;
    seenFormulae.add(formula);
    return true;
  }).slice(0, 3);
}

export const moodChoices: Array<{ id: MoodId; label: string; description: string }> = [
  { id: 'calm', label: 'Calm and minimal', description: 'Quiet, uncluttered, and easy to live with.' },
  { id: 'warm', label: 'Warm and welcoming', description: 'Inviting, layered, and gently generous.' },
  { id: 'dramatic', label: 'Bold and dramatic', description: 'A considered statement at the threshold.' },
  { id: 'romantic', label: 'Romantic and soft', description: 'Tender color, softness, and garden memory.' },
  { id: 'natural', label: 'Fresh and natural', description: 'Garden-like, organic, and airy.' },
  { id: 'festive', label: 'Cosy and festive', description: 'Seasonal warmth with a feeling of celebration.' },
];

export const seasonChoices: Array<{ id: SeasonId; label: string }> = [
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
  { id: 'occasion', label: 'A special occasion' },
];

export const doorChoices: Array<{ id: DoorId; label: string; description: string }> = [
  { id: 'dark-wood', label: 'Dark wood', description: 'Rich stain, walnut, oak, or deep timber.' },
  { id: 'painted-light', label: 'Painted light', description: 'White, cream, pale blue, or soft green.' },
  { id: 'modern', label: 'Modern', description: 'Clean lines, black, glass, or metal.' },
  { id: 'rustic', label: 'Rustic', description: 'Textural, weathered, or cottage-like.' },
  { id: 'neutral', label: 'Neutral', description: 'Stone, linen, taupe, or a flexible backdrop.' },
];

export const moodoorQualityThreshold = MINIMUM_QUALITY_SCORE;
