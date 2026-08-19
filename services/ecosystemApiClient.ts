import { auth } from '../lib/firebase';
import type { Blueprint } from '../types';
import type { MoodProfile, MoodoorListing, MoodoorMatch } from './moodoorMatchingCore';

export class EcosystemApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'EcosystemApiError';
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}, requiresAuth = false): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  if (requiresAuth) {
    const user = auth.currentUser;
    if (!user) throw new EcosystemApiError('Sign in to continue.', 401, 'AUTH_REQUIRED');
    headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  }

  const response = await fetch(path, { ...init, headers });
  const body = await response.json().catch(() => null) as T | { error?: { code?: string; message?: string } } | null;
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'error' in body ? body.error : undefined;
    throw new EcosystemApiError(error?.message || 'The request could not be completed.', response.status, error?.code || 'REQUEST_FAILED');
  }
  return body as T;
}

export type MakerListingInput = {
  blueprint: Blueprint;
  public: {
    title: string;
    summary: string;
    heroImageUrl: string | null;
    price: number | null;
    moodTags: string[];
    seasonTags: string[];
    paletteTags: string[];
    formula: string | null;
  };
  availability: 'in_stock' | 'limited' | 'unavailable';
  marketplaceStatus: 'draft' | 'published';
};

export type MakerListingResult = {
  blueprintId: string;
  revisionId: string;
  listingId: string;
  marketplaceStatus: 'draft' | 'published';
  quality: {
    score: number;
    status: 'pass' | 'repair_needed';
    warnings: string[];
    dimensions: Record<string, number>;
  };
  requiresRepair: boolean;
};

export async function createMakerListing(input: MakerListingInput): Promise<MakerListingResult> {
  return apiRequest<MakerListingResult>('/api/v1/maker/listings', {
    method: 'POST',
    body: JSON.stringify(input),
  }, true);
}

export async function updateMarketplacePublication(listingId: string, action: 'publish' | 'unpublish'): Promise<{ listingId: string; marketplaceStatus: 'draft' | 'published' }> {
  return apiRequest(`/api/v1/maker/listings/${listingId}/marketplace`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  }, true);
}

export async function getMoodoorMatches(profile: MoodProfile): Promise<{ matches: Array<Omit<MoodoorMatch, 'score'> & { listing: MoodoorListing & { slug?: string } }>; noMatch: boolean }> {
  return apiRequest('/api/v1/moodoor/matches', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export async function getMoodoorPublicListing(slug: string): Promise<{ listing: MoodoorListing & { slug: string } }> {
  return apiRequest(`/api/v1/moodoor/listings/${encodeURIComponent(slug)}`);
}

export async function getMoodoorStudioListings(): Promise<{ listings: MoodoorListing[] }> {
  return apiRequest('/api/v1/moodoor/studio/listings', {}, true);
}

export async function updateMoodoorPublication(listingId: string, action: 'publish' | 'unpublish'): Promise<unknown> {
  return apiRequest(`/api/v1/moodoor/studio/listings/${listingId}/publication`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  }, true);
}
