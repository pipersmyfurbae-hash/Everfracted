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

export const moodoorQualityThreshold = 0.78;

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

export function normalizeMoodoorText(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]/g, ' ');
}

function hasAny(haystack: string[], signals: string[]): boolean {
  const searchable = haystack.map(normalizeMoodoorText).join(' ');
  return signals.some((signal) => searchable.includes(normalizeMoodoorText(signal)));
}

function listingText(listing: MoodoorListing): string[] {
  return [listing.title, listing.summary, listing.formula || '', ...listing.seasonTags, ...listing.moodTags, ...listing.paletteTags];
}

/**
 * Rank an already-authorized catalogue. Eligibility is rechecked defensively,
 * while catalogue acquisition and public-data projection remain external concerns.
 */
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
    const formula = normalizeMoodoorText(match.listing.formula || match.listing.title);
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
