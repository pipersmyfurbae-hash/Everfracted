import type { Express } from 'express';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { scoreBlueprint } from '../services/blueprintScoringEngine.ts';
import { ECOSYSTEM_SCHEMA } from '../services/ecosystemContracts.ts';
import { normalizeMarketplaceCommerce, type MarketplaceCommerce } from '../services/commerceMode.ts';
import type { Blueprint } from '../types.ts';
import { ownsOrAdmins, requireStudioMaker, sendApiError, type ApiUser } from './apiAuth.ts';

type Availability = 'in_stock' | 'limited' | 'unavailable';
type MarketplaceStatus = 'draft' | 'published';

type PublicMetadataInput = {
  title: string;
  summary: string;
  heroImageUrl: string | null;
  price: number | null;
  moodTags: string[];
  seasonTags: string[];
  paletteTags: string[];
  formula: string | null;
};

type CreateListingInput = {
  blueprint: Blueprint;
  public: PublicMetadataInput;
  availability: Availability;
  marketplaceStatus: MarketplaceStatus;
  commerce: MarketplaceCommerce;
};

function asTrimmedString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength ? value.trim() : null;
}

function asOptionalUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function asTags(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 12) return null;
  const tags = value.map((entry) => asTrimmedString(entry, 40));
  return tags.every((tag): tag is string => tag !== null) ? [...new Set(tags.map((tag) => tag.toLowerCase()))] : null;
}

function parseInput(value: unknown): CreateListingInput | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const publicData = body.public;
  if (!publicData || typeof publicData !== 'object' || !body.blueprint || typeof body.blueprint !== 'object') return null;
  const data = publicData as Record<string, unknown>;
  const title = asTrimmedString(data.title, 140);
  const summary = asTrimmedString(data.summary, 600);
  const heroImageUrl = asOptionalUrl(data.heroImageUrl);
  const price = data.price === null || data.price === undefined ? null : typeof data.price === 'number' && Number.isFinite(data.price) && data.price >= 0 ? data.price : null;
  const moodTags = asTags(data.moodTags);
  const seasonTags = asTags(data.seasonTags);
  const paletteTags = asTags(data.paletteTags);
  const formula = data.formula === null || data.formula === undefined || data.formula === '' ? null : asTrimmedString(data.formula, 80);
  const availability = body.availability;
  const marketplaceStatus = body.marketplaceStatus;
  const commerce = body.commerce === undefined
    ? { mode: 'enquiry', provider: null, variantId: null } as const
    : normalizeMarketplaceCommerce(body.commerce);

  if (!title || !summary || !moodTags || !seasonTags || !paletteTags || !commerce || !['in_stock', 'limited', 'unavailable'].includes(String(availability)) || !['draft', 'published'].includes(String(marketplaceStatus))) {
    return null;
  }

  return {
    blueprint: body.blueprint as Blueprint,
    public: { title, summary, heroImageUrl, price, moodTags, seasonTags, paletteTags, formula },
    availability: availability as Availability,
    marketplaceStatus: marketplaceStatus as MarketplaceStatus,
    commerce,
  };
}

function normalizedQuality(blueprint: Blueprint): { score: number; status: 'pass' | 'repair_needed'; warnings: string[]; dimensions: Record<string, number> } {
  const report = scoreBlueprint(blueprint);
  return {
    score: Math.round((report.total / 100) * 100) / 100,
    status: report.status === 'PASS' ? 'pass' : 'repair_needed',
    warnings: report.warnings,
    dimensions: report.dimensions,
  };
}

function canMarketplacePublish(input: CreateListingInput, quality: ReturnType<typeof normalizedQuality>): boolean {
  const checkoutHasPrice = input.commerce.mode !== 'direct_checkout' || input.public.price !== null;
  return input.marketplaceStatus === 'published' && input.availability !== 'unavailable' && checkoutHasPrice && quality.status === 'pass' && quality.score >= 0.78;
}

export function registerMakerApi(app: Express, db: Firestore): void {
  app.post('/api/v1/maker/listings', requireStudioMaker(db), async (req, res) => {
    const input = parseInput(req.body);
    if (!input) {
      sendApiError(res, 400, 'INVALID_LISTING_INPUT', 'Provide a blueprint, public title and summary, valid tags, price, availability, and marketplace status.');
      return;
    }

    const user = res.locals.apiUser as ApiUser;
    const quality = normalizedQuality(input.blueprint);
    const actualStatus: MarketplaceStatus = canMarketplacePublish(input, quality) ? 'published' : 'draft';
    const blueprintRef = db.collection('blueprints').doc();
    const revisionRef = db.collection('blueprint_revisions').doc();
    const listingRef = db.collection('marketplace_listings').doc();

    try {
      const now = FieldValue.serverTimestamp();
      const base = input.blueprint.base || null;
      const elements = Array.isArray(input.blueprint.elements) ? input.blueprint.elements : [];
      await db.runTransaction(async (transaction) => {
        transaction.set(blueprintRef, {
          schemaVersion: 'blueprint.v2',
          userId: user.uid,
          title: input.public.title,
          formula: input.public.formula || input.blueprint.formula || null,
          seed: input.blueprint.seed || null,
          diameter: input.blueprint.diameter || base?.diameter_inches || null,
          base,
          currentRevision: 1,
          quality,
          createdAt: now,
          updatedAt: now,
        });
        transaction.set(revisionRef, {
          schemaVersion: 'blueprint_revision.v1',
          userId: user.uid,
          blueprintId: blueprintRef.id,
          revision: 1,
          blueprint: input.blueprint,
          elements,
          quality,
          createdAt: now,
        });
        transaction.set(listingRef, {
          schemaVersion: ECOSYSTEM_SCHEMA.marketplaceListing,
          creatorId: user.uid,
          title: input.public.title,
          summary: input.public.summary,
          price: input.public.price,
          imageUrl: input.public.heroImageUrl,
          formula: input.public.formula || input.blueprint.formula || null,
          moodTags: input.public.moodTags,
          seasons: input.public.seasonTags,
          palette: input.public.paletteTags,
          availability: input.availability,
          qualityScore: quality.score,
          qualityApproved: quality.status === 'pass',
          scoreReport: { total: quality.score, status: quality.status === 'pass' ? 'pass' : 'repair_needed' },
          blueprintRef: { blueprintId: blueprintRef.id, revision: 1 },
          status: actualStatus,
          publishedAt: actualStatus === 'published' ? now : null,
          moodoorPublished: false,
          moodoorStatus: 'private',
          commerce: input.commerce,
          createdAt: now,
          updatedAt: now,
        });
      });

      res.status(201).json({
        blueprintId: blueprintRef.id,
        revisionId: revisionRef.id,
        listingId: listingRef.id,
        marketplaceStatus: actualStatus,
        quality,
        requiresRepair: actualStatus !== 'published',
      });
    } catch (error) {
      console.error('Maker listing creation error:', error);
      sendApiError(res, 500, 'LISTING_CREATE_FAILED', 'The blueprint and marketplace listing could not be saved.');
    }
  });

  app.patch('/api/v1/maker/listings/:listingId/marketplace', requireStudioMaker(db), async (req, res) => {
    const action = (req.body as { action?: unknown } | null)?.action;
    if (action !== 'publish' && action !== 'unpublish') {
      sendApiError(res, 400, 'INVALID_ACTION', 'Set action to publish or unpublish.');
      return;
    }

    const user = res.locals.apiUser as ApiUser;
    const listingRef = db.collection('marketplace_listings').doc(req.params.listingId);
    const projectionRef = db.collection('moodoor_public_listings').doc(req.params.listingId);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(listingRef);
        if (!snapshot.exists) throw new Error('LISTING_NOT_FOUND');
        const data = snapshot.data() || {};
        if (!ownsOrAdmins(user, data.creatorId)) throw new Error('LISTING_FORBIDDEN');

        if (action === 'publish') {
          const score = typeof data.qualityScore === 'number' ? data.qualityScore : 0;
          const passed = data.qualityApproved === true || (data.scoreReport?.status === 'pass') || score >= 0.78;
          if (!passed || data.availability === 'unavailable') throw new Error('LISTING_INELIGIBLE');
          transaction.update(listingRef, { status: 'published', publishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
          return { listingId: snapshot.id, marketplaceStatus: 'published' };
        }

        transaction.update(listingRef, {
          status: 'draft',
          moodoorPublished: false,
          moodoorStatus: 'unpublished',
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.delete(projectionRef);
        return { listingId: snapshot.id, marketplaceStatus: 'draft' };
      });
      res.json(result);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'MARKETPLACE_UPDATE_FAILED';
      if (code === 'LISTING_NOT_FOUND') {
        sendApiError(res, 404, code, 'This marketplace listing does not exist.');
      } else if (code === 'LISTING_FORBIDDEN') {
        sendApiError(res, 403, code, 'You can only manage your own marketplace listings.');
      } else if (code === 'LISTING_INELIGIBLE') {
        sendApiError(res, 422, code, 'Resolve quality review and availability before publishing this listing.');
      } else {
        console.error('Maker marketplace update error:', error);
        sendApiError(res, 500, 'MARKETPLACE_UPDATE_FAILED', 'Marketplace publication could not be updated.');
      }
    }
  });
}
