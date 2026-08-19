import type { Express, Response } from 'express';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import {
  rankMoodoorMatches,
  type DoorId,
  type MoodId,
  type MoodoorListing,
  type MoodProfile,
  type SeasonId,
} from '../services/moodoorMatchingCore.ts';
import {
  toMoodoorCandidate,
  type MarketplaceDocument,
} from '../services/moodoorProjection.ts';
import {
  ownsOrAdmins,
  requireStudioMaker,
  sendApiError,
  type ApiUser,
} from './apiAuth.ts';

type PublicListingResponse = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  availability: 'in_stock' | 'limited';
  formula: string | null;
  seasonTags: string[];
  moodTags: string[];
  paletteTags: string[];
  publishedAt: string | null;
};

const moodIds = new Set<MoodId>(['calm', 'warm', 'dramatic', 'romantic', 'natural', 'festive']);
const seasonIds = new Set<SeasonId>(['spring', 'summer', 'autumn', 'winter', 'occasion']);
const doorIds = new Set<DoorId>(['dark-wood', 'painted-light', 'modern', 'rustic', 'neutral']);

function toIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'evercrafted-wreath';
}

function toPublicResponse(listing: MoodoorListing, slug: string): PublicListingResponse {
  return {
    id: listing.id,
    slug,
    title: listing.title,
    summary: listing.summary,
    imageUrl: listing.imageUrl,
    price: listing.price,
    currency: listing.currency,
    availability: listing.availability === 'limited' ? 'limited' : 'in_stock',
    formula: listing.formula,
    seasonTags: listing.seasonTags,
    moodTags: listing.moodTags,
    paletteTags: listing.paletteTags,
    publishedAt: listing.publishedAt,
  };
}

function fromPublicProjection(id: string, data: Record<string, unknown>): MoodoorListing | null {
  const availability = data.availability === 'limited' ? 'limited' : data.availability === 'in_stock' ? 'in_stock' : null;
  if (!availability || typeof data.title !== 'string' || typeof data.summary !== 'string') return null;

  const price = typeof data.price === 'object' && data.price !== null && typeof (data.price as { amount?: unknown }).amount === 'number'
    ? (data.price as { amount: number }).amount
    : null;
  const currency = typeof data.price === 'object' && data.price !== null && typeof (data.price as { currency?: unknown }).currency === 'string'
    ? (data.price as { currency: string }).currency
    : 'USD';

  return {
    id,
    title: data.title,
    summary: data.summary,
    imageUrl: typeof data.heroImageUrl === 'string' ? data.heroImageUrl : null,
    price,
    currency,
    seasonTags: asStringArray(data.seasonTags),
    moodTags: asStringArray(data.moodTags),
    paletteTags: asStringArray(data.paletteTags),
    formula: typeof data.formula === 'string' ? data.formula : null,
    availability,
    quality: 'approved',
    publishedAt: toIso(data.publishedAt),
    isMoodoorPublished: true,
  };
}

function parseProfile(value: unknown): MoodProfile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { mood?: unknown; season?: unknown; door?: unknown };
  if (!moodIds.has(candidate.mood as MoodId) || !seasonIds.has(candidate.season as SeasonId) || !doorIds.has(candidate.door as DoorId)) {
    return null;
  }
  return {
    mood: candidate.mood as MoodId,
    season: candidate.season as SeasonId,
    door: candidate.door as DoorId,
  };
}

function parsePublicationAction(value: unknown): 'publish' | 'unpublish' | null {
  if (!value || typeof value !== 'object') return null;
  const action = (value as { action?: unknown }).action;
  return action === 'publish' || action === 'unpublish' ? action : null;
}

/**
 * Mount server-owned Moodoor APIs. The public match endpoint reads only the
 * safe projection collection. Maker endpoints read canonical listings, enforce
 * quality/availability/ownership inside a Firestore transaction, then create
 * or revoke the public projection atomically.
 */
export function registerMoodoorApi(app: Express, db: Firestore): void {
  app.post('/api/v1/moodoor/matches', async (req, res) => {
    const profile = parseProfile(req.body);
    if (!profile) {
      sendApiError(res, 400, 'INVALID_PROFILE', 'Provide one supported mood, season, and door value.');
      return;
    }

    try {
      const projection = await db.collection('moodoor_public_listings').get();
      const catalog = projection.docs
        .map((entry) => fromPublicProjection(entry.id, entry.data()))
        .filter((entry): entry is MoodoorListing => entry !== null);
      const matches = rankMoodoorMatches(profile, catalog);

      res.json({
        matches: matches.map((match) => ({
          listing: toPublicResponse(match.listing, String(projection.docs.find((entry) => entry.id === match.listing.id)?.data().slug || slugify(match.listing.title))),
          explanation: match.explanation,
          matchedSignals: match.matchedSignals,
        })),
        noMatch: matches.length === 0,
      });
    } catch (error) {
      console.error('Moodoor public match error:', error);
      sendApiError(res, 500, 'CATALOGUE_UNAVAILABLE', 'Moodoor could not read the current wreath edit. Please try again.');
    }
  });

  app.get('/api/v1/moodoor/listings/:slug', async (req, res) => {
    try {
      const snapshot = await db.collection('moodoor_public_listings').where('slug', '==', req.params.slug).limit(1).get();
      if (snapshot.empty) {
        sendApiError(res, 404, 'LISTING_NOT_FOUND', 'This Moodoor wreath is no longer in the current edit.');
        return;
      }
      const entry = snapshot.docs[0];
      const listing = fromPublicProjection(entry.id, entry.data());
      if (!listing) {
        sendApiError(res, 404, 'LISTING_NOT_FOUND', 'This Moodoor wreath is no longer in the current edit.');
        return;
      }
      res.json({ listing: toPublicResponse(listing, req.params.slug) });
    } catch (error) {
      console.error('Moodoor public detail error:', error);
      sendApiError(res, 500, 'CATALOGUE_UNAVAILABLE', 'Moodoor could not read this wreath. Please try again.');
    }
  });

  app.get('/api/v1/moodoor/studio/listings', requireStudioMaker(db), async (req, res) => {
    const user = res.locals.apiUser as ApiUser;
    try {
      const snapshot = await db.collection('marketplace_listings').where('creatorId', '==', user.uid).get();
      const listings = snapshot.docs
        .map((entry) => toMoodoorCandidate(entry.id, entry.data() as MarketplaceDocument))
        .filter((entry): entry is MoodoorListing => entry !== null)
        .sort((a, b) => a.title.localeCompare(b.title));
      res.json({ listings });
    } catch (error) {
      console.error('Moodoor Studio list error:', error);
      sendApiError(res, 500, 'STUDIO_UNAVAILABLE', 'Moodoor Studio could not load your publishable designs.');
    }
  });

  app.patch('/api/v1/moodoor/studio/listings/:listingId/publication', requireStudioMaker(db), async (req, res) => {
    const action = parsePublicationAction(req.body);
    if (!action) {
      sendApiError(res, 400, 'INVALID_ACTION', 'Set action to publish or unpublish.');
      return;
    }

    const user = res.locals.apiUser as ApiUser;
    const listingRef = db.collection('marketplace_listings').doc(req.params.listingId);
    const projectionRef = db.collection('moodoor_public_listings').doc(req.params.listingId);
    const eventRef = db.collection('moodoor_publication_events').doc();

    try {
      const response = await db.runTransaction(async (transaction) => {
        const listingSnapshot = await transaction.get(listingRef);
        if (!listingSnapshot.exists) {
          const missing = new Error('LISTING_NOT_FOUND');
          throw missing;
        }
        const raw = listingSnapshot.data() as MarketplaceDocument;
        if (!ownsOrAdmins(user, raw.creatorId)) {
          const forbidden = new Error('LISTING_FORBIDDEN');
          throw forbidden;
        }

        if (action === 'publish') {
          const candidate = toMoodoorCandidate(listingSnapshot.id, raw);
          if (!candidate) {
            const ineligible = new Error('LISTING_INELIGIBLE');
            throw ineligible;
          }

          const slug = `${slugify(candidate.title)}-${candidate.id.slice(0, 8)}`;
          transaction.update(listingRef, {
            moodoorPublished: true,
            moodoorStatus: 'published',
            moodoorUpdatedAt: FieldValue.serverTimestamp(),
          });
          transaction.set(projectionRef, {
            schemaVersion: 'moodoor_public_listing.v1',
            listingId: candidate.id,
            slug,
            title: candidate.title,
            summary: candidate.summary,
            heroImageUrl: candidate.imageUrl,
            price: { amount: candidate.price, currency: candidate.currency },
            availability: candidate.availability,
            formula: candidate.formula,
            seasonTags: candidate.seasonTags,
            moodTags: candidate.moodTags,
            paletteTags: candidate.paletteTags,
            publishedAt: FieldValue.serverTimestamp(),
            sourceVersion: { listingSchema: 'marketplace_listing.v1_compat', listingUpdatedAt: FieldValue.serverTimestamp() },
          });
          transaction.set(eventRef, {
            listingId: candidate.id,
            actorId: user.uid,
            action: 'published',
            occurredAt: FieldValue.serverTimestamp(),
            sourceStatus: String(raw.status || ''),
          });
          return { listing: toPublicResponse({ ...candidate, isMoodoorPublished: true }, slug), action };
        }

        transaction.update(listingRef, {
          moodoorPublished: false,
          moodoorStatus: 'unpublished',
          moodoorUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.delete(projectionRef);
        transaction.set(eventRef, {
          listingId: listingSnapshot.id,
          actorId: user.uid,
          action: 'unpublished',
          occurredAt: FieldValue.serverTimestamp(),
          sourceStatus: String(raw.status || ''),
        });
        return { listingId: listingSnapshot.id, action };
      });

      res.json(response);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'PUBLICATION_FAILED';
      if (code === 'LISTING_NOT_FOUND') {
        sendApiError(res, 404, code, 'This marketplace listing no longer exists.');
      } else if (code === 'LISTING_FORBIDDEN') {
        sendApiError(res, 403, code, 'You can only manage your own marketplace listings.');
      } else if (code === 'LISTING_INELIGIBLE') {
        sendApiError(res, 422, code, 'Publish to the marketplace, resolve quality review, and confirm availability before releasing this design to Moodoor.');
      } else {
        console.error('Moodoor publication error:', error);
        sendApiError(res, 500, 'PUBLICATION_FAILED', 'Moodoor publication could not be updated. Please try again.');
      }
    }
  });
}
