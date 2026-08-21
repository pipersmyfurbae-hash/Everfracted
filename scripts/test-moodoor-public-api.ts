import assert from 'node:assert/strict';
import express from 'express';
import { registerCommerceApi } from '../server/commerceApi';
import { registerMoodoorApi } from '../server/moodoorApi';

type ProjectionRecord = { id: string; data: Record<string, unknown> };

const publicProjection: ProjectionRecord[] = [
  {
    id: 'listing-calm',
    data: {
      listingId: 'canonical-calm',
      slug: 'quiet-winter-welcome-listing-calm',
      title: 'Quiet Winter Welcome',
      summary: 'Evergreen structure softened by ivory blooms and a warm, measured rhythm.',
      heroImageUrl: 'https://example.test/quiet-winter.jpg',
      price: { amount: 148, currency: 'USD' },
      availability: 'in_stock',
      commerce: { mode: 'direct_checkout' },
      formula: 'crescent',
      seasonTags: ['winter'],
      moodTags: ['calm', 'warm'],
      paletteTags: ['evergreen', 'ivory'],
      publishedAt: { toDate: () => new Date('2026-08-19T12:00:00.000Z') },
      privateInventoryQuantity: 37,
      supplierName: 'Must not reach customers',
    },
  },
  {
    id: 'listing-natural',
    data: {
      listingId: 'canonical-natural',
      slug: 'late-summer-garden-listing-natural',
      title: 'Late Summer Garden',
      summary: 'A natural entryway composition with botanical texture and gentle breadth.',
      heroImageUrl: null,
      price: { amount: 162, currency: 'USD' },
      availability: 'limited',
      commerce: { mode: 'enquiry' },
      formula: 'asymmetric-weight',
      seasonTags: ['summer'],
      moodTags: ['natural'],
      paletteTags: ['sage', 'ivory'],
      publishedAt: { toDate: () => new Date('2026-08-18T12:00:00.000Z') },
    },
  },
];

const canonicalRecords: Record<string, Record<string, unknown>> = {
  'canonical-calm': {
    status: 'published',
    moodoorPublished: true,
    availability: 'in_stock',
    commerce: { mode: 'direct_checkout', provider: 'shopify', variantId: 'gid://shopify/ProductVariant/987654321' },
  },
};

function makeSnapshot(records: ProjectionRecord[]) {
  return {
    empty: records.length === 0,
    docs: records.map((record) => ({ id: record.id, data: () => record.data })),
  };
}

const fakeDb = {
  collection(name: string) {
    if (name === 'moodoor_public_listings') {
      return {
        get: async () => makeSnapshot(publicProjection),
        where: (field: string, operator: string, value: unknown) => ({
          limit: () => ({
            get: async () => makeSnapshot(publicProjection.filter((record) => field === 'slug' && operator === '==' && record.data.slug === value)),
          }),
        }),
      };
    }
    if (name === 'marketplace_listings') {
      return {
        doc: (id: string) => ({
          get: async () => ({ exists: Boolean(canonicalRecords[id]), data: () => canonicalRecords[id] }),
        }),
      };
    }
    throw new Error(`Unexpected collection access in public API test: ${name}`);
  },
};

const app = express();
app.use(express.json());
registerMoodoorApi(app, fakeDb as never);
registerCommerceApi(app, fakeDb as never);

const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
  const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
});
const address = server.address();
assert.ok(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;

try {
  const browseResponse = await fetch(`${origin}/api/v1/moodoor/listings`);
  assert.equal(browseResponse.status, 200);
  const browseBody = await browseResponse.json() as { listings: Array<Record<string, unknown>> };
  assert.equal(browseBody.listings.length, 2);
  assert.equal(browseBody.listings[0].title, 'Quiet Winter Welcome', 'Newest published projection must appear first.');
  assert.deepEqual(Object.keys(browseBody.listings[0]).sort(), ['availability', 'commerce', 'currency', 'formula', 'id', 'imageUrl', 'moodTags', 'paletteTags', 'price', 'publishedAt', 'seasonTags', 'slug', 'summary', 'title']);
  assert.deepEqual(browseBody.listings[0].commerce, { mode: 'direct_checkout' });
  assert.equal('privateInventoryQuantity' in browseBody.listings[0], false, 'Raw inventory must never leave the public projection API.');
  assert.equal('supplierName' in browseBody.listings[0], false, 'Supplier data must never leave the public projection API.');
  assert.equal('variantId' in (browseBody.listings[0].commerce as Record<string, unknown>), false, 'Provider variant references must never leave the public projection API.');

  const detailResponse = await fetch(`${origin}/api/v1/moodoor/listings/quiet-winter-welcome-listing-calm`);
  assert.equal(detailResponse.status, 200);
  const detailBody = await detailResponse.json() as { listing: Record<string, unknown> };
  assert.equal(detailBody.listing.slug, 'quiet-winter-welcome-listing-calm');
  assert.equal(detailBody.listing.availability, 'in_stock');
  assert.deepEqual(detailBody.listing.commerce, { mode: 'direct_checkout' });
  assert.equal('privateInventoryQuantity' in detailBody.listing, false);

  const matchResponse = await fetch(`${origin}/api/v1/moodoor/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood: 'calm', season: 'winter', door: 'dark-wood' }),
  });
  assert.equal(matchResponse.status, 200);
  const matchBody = await matchResponse.json() as { matches: Array<{ listing: Record<string, unknown>; explanation: string }>; noMatch: boolean };
  assert.equal(matchBody.noMatch, false);
  assert.equal(matchBody.matches[0].listing.title, 'Quiet Winter Welcome');
  assert.deepEqual(matchBody.matches[0].listing.commerce, { mode: 'direct_checkout' });
  assert.equal('privateInventoryQuantity' in matchBody.matches[0].listing, false);
  assert.match(matchBody.matches[0].explanation, /calm/i);

  const enquiryCheckout = await fetch(`${origin}/api/v1/moodoor/listings/late-summer-garden-listing-natural/checkout`, { method: 'POST' });
  assert.equal(enquiryCheckout.status, 409, 'Enquiry listings must not create direct checkout sessions.');

  const unconfiguredCheckout = await fetch(`${origin}/api/v1/moodoor/listings/quiet-winter-welcome-listing-calm/checkout`, { method: 'POST' });
  assert.equal(unconfiguredCheckout.status, 503, 'Direct checkout must fail closed until private Shopify configuration is present.');

  const badProfile = await fetch(`${origin}/api/v1/moodoor/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood: 'unsupported', season: 'winter', door: 'dark-wood' }),
  });
  assert.equal(badProfile.status, 400);

  console.log('Moodoor public API tests passed: browse, detail, matching, hybrid commerce privacy, safe checkout failure, validation, chronology, and private-field exclusion verified.');
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
