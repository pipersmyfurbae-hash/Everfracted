import assert from 'node:assert/strict';
import {
  doorChoices,
  moodChoices,
  moodoorQualityThreshold,
  rankMoodoorMatches,
  seasonChoices,
  toMoodoorCandidate,
  toMoodoorListing,
  type MoodoorListing,
  type MoodProfile,
} from '../services/moodoorMatching';

type TestCase = { name: string; run: () => void };

const cases: TestCase[] = [];

function test(name: string, run: () => void): void {
  cases.push({ name, run });
}

function makeListing(overrides: Partial<MoodoorListing> = {}): MoodoorListing {
  return {
    id: 'winter-hearth',
    title: 'Winter Hearth',
    summary: 'A warm, evergreen wreath with cedar and quiet brass.',
    imageUrl: null,
    price: 148,
    currency: 'USD',
    seasonTags: ['winter'],
    moodTags: ['warm'],
    paletteTags: ['golden', 'evergreen'],
    formula: 'crescent',
    availability: 'in_stock',
    quality: 'approved',
    publishedAt: null,
    isMoodoorPublished: true,
    ...overrides,
  };
}

function makeRawListing(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    status: 'published',
    title: 'Winter Hearth',
    description: 'A warm evergreen wreath with golden brass.',
    price: 148,
    qualityScore: 0.78,
    availability: 'in stock',
    moodoorPublished: true,
    ...overrides,
  };
}

const warmWinterDarkWood: MoodProfile = {
  mood: 'warm',
  season: 'winter',
  door: 'dark-wood',
};

function singleMatch(profile: MoodProfile, listing: MoodoorListing): ReturnType<typeof rankMoodoorMatches>[number] {
  const result = rankMoodoorMatches(profile, [listing]);
  assert.equal(result.length, 1, 'Expected one qualifying match.');
  return result[0];
}

function assertScore(actual: number, expected: number, message?: string): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, message || `Expected ${expected}; received ${actual}.`);
}

// ---------------------------------------------------------------------------
// Public vocabulary and source-contract behaviour
// ---------------------------------------------------------------------------

test('exports the six moods, five seasons, five doors, and the 0.78 quality threshold', () => {
  assert.deepEqual(moodChoices.map((choice) => choice.id), ['calm', 'warm', 'dramatic', 'romantic', 'natural', 'festive']);
  assert.deepEqual(seasonChoices.map((choice) => choice.id), ['spring', 'summer', 'autumn', 'winter', 'occasion']);
  assert.deepEqual(doorChoices.map((choice) => choice.id), ['dark-wood', 'painted-light', 'modern', 'rustic', 'neutral']);
  assert.equal(moodoorQualityThreshold, 0.78);
});

// ---------------------------------------------------------------------------
// Candidate projection: legacy-field normalization, availability, and quality
// ---------------------------------------------------------------------------

test('normalizes a published raw marketplace record into the customer-safe listing shape', () => {
  const candidate = toMoodoorCandidate('listing-1', makeRawListing({
    seasons: ['winter', 7, null],
    moodTags: ['warm', 7, null],
    palette: { primary: 'golden', secondary: 'evergreen', ignored: 7 },
    createdAt: { toDate: () => new Date('2026-08-19T12:00:00.000Z') },
  }));

  assert.deepEqual(candidate, {
    id: 'listing-1',
    title: 'Winter Hearth',
    summary: 'A warm evergreen wreath with golden brass.',
    imageUrl: null,
    price: 148,
    currency: 'USD',
    seasonTags: ['winter'],
    moodTags: ['warm'],
    paletteTags: ['golden', 'evergreen'],
    formula: null,
    availability: 'in_stock',
    quality: 'approved',
    publishedAt: '2026-08-19T12:00:00.000Z',
    isMoodoorPublished: true,
  });
});

test('supports legacy name, summary, image aliases, season string, emotional tags, and render fallback', () => {
  const candidate = toMoodoorCandidate('legacy', makeRawListing({
    title: undefined,
    name: 'Legacy Garden',
    description: undefined,
    summary: 'Legacy summary',
    imageUrl: undefined,
    image_url: 'https://example.test/legacy.jpg',
    renderUrl: 'https://example.test/render.jpg',
    season: 'Spring',
    moodTags: undefined,
    emotionalTags: ['natural'],
    palette: ['green'],
  }));

  assert.equal(candidate?.title, 'Legacy Garden');
  assert.equal(candidate?.summary, 'Legacy summary');
  assert.equal(candidate?.imageUrl, 'https://example.test/legacy.jpg');
  assert.deepEqual(candidate?.seasonTags, ['Spring']);
  assert.deepEqual(candidate?.moodTags, ['natural']);
  assert.deepEqual(candidate?.paletteTags, ['green']);
});

test('prefers imageUrl over image_url and renderUrl, and title over name', () => {
  const candidate = toMoodoorCandidate('precedence', makeRawListing({
    title: 'Primary title',
    name: 'Fallback title',
    imageUrl: 'https://example.test/primary.jpg',
    image_url: 'https://example.test/secondary.jpg',
    renderUrl: 'https://example.test/tertiary.jpg',
  }));

  assert.equal(candidate?.title, 'Primary title');
  assert.equal(candidate?.imageUrl, 'https://example.test/primary.jpg');
});

test('uses safe defaults for a sparse but otherwise valid source record', () => {
  const candidate = toMoodoorCandidate('sparse', {
    status: 'published',
    qualityScore: 0.78,
    moodoorStatus: 'published',
  });

  assert.equal(candidate?.title, 'Untitled wreath');
  assert.equal(candidate?.summary, 'A published Evercrafted wreath selected for its botanical character and compositional clarity.');
  assert.equal(candidate?.price, null);
  assert.equal(candidate?.imageUrl, null);
  assert.deepEqual(candidate?.seasonTags, []);
  assert.deepEqual(candidate?.moodTags, []);
  assert.deepEqual(candidate?.paletteTags, []);
});

test('treats published status case-insensitively and with surrounding whitespace', () => {
  const candidate = toMoodoorCandidate('case-status', makeRawListing({ status: '  PUBLISHED  ' }));
  assert.notEqual(candidate, null);
});

test('rejects draft, archived, missing, and non-string marketplace statuses', () => {
  for (const status of ['draft', 'archived', undefined, 1]) {
    assert.equal(toMoodoorCandidate(`status-${String(status)}`, makeRawListing({ status })), null);
  }
});

test('normalizes all unavailable availability phrases before limited phrases', () => {
  for (const availability of ['out', 'out of stock', 'sold out', 'unavailable', 'discontinued', 'out and limited']) {
    assert.equal(toMoodoorCandidate(`unavailable-${availability}`, makeRawListing({ availability })), null, `${availability} must be unavailable.`);
  }
});

test('normalizes low, limited, and few remaining inventory values to limited', () => {
  for (const availability of ['low stock', 'limited release', 'few remaining']) {
    const candidate = toMoodoorCandidate(`limited-${availability}`, makeRawListing({ availability }));
    assert.equal(candidate?.availability, 'limited', `${availability} must normalize to limited.`);
  }
});

test('uses inventoryStatus when availability is absent and defaults to in_stock when both are absent', () => {
  const limited = toMoodoorCandidate('inventory-status', makeRawListing({ availability: undefined, inventoryStatus: 'few remaining' }));
  const defaulted = toMoodoorCandidate('availability-default', makeRawListing({ availability: undefined, inventoryStatus: undefined }));
  assert.equal(limited?.availability, 'limited');
  assert.equal(defaulted?.availability, 'in_stock');
});

test('accepts the quality score exactly at 0.78 and rejects an immediately lower score', () => {
  assert.equal(toMoodoorCandidate('at-threshold', makeRawListing({ qualityScore: 0.78 }))?.quality, 'approved');
  assert.equal(toMoodoorCandidate('below-threshold', makeRawListing({ qualityScore: 0.779 })), null);
});

test('accepts legacy score and scoreReport.total quality fields at the threshold', () => {
  const fromScore = toMoodoorCandidate('legacy-score', makeRawListing({ qualityScore: undefined, score: 0.78 }));
  const fromScoreReport = toMoodoorCandidate('report-score', makeRawListing({ qualityScore: undefined, score: undefined, scoreReport: { total: 0.78 } }));
  assert.equal(fromScore?.quality, 'approved');
  assert.equal(fromScoreReport?.quality, 'approved');
});

test('accepts explicit approval and PASS status even if a numerical score is below threshold', () => {
  const explicit = toMoodoorCandidate('approved-flag', makeRawListing({ qualityScore: 0.1, qualityApproved: true }));
  const passedReport = toMoodoorCandidate('approved-report', makeRawListing({ qualityScore: 0.1, scoreReport: { status: '  PASS  ' } }));
  assert.equal(explicit?.quality, 'approved');
  assert.equal(passedReport?.quality, 'approved');
});

test('rejects candidate records without explicit approval or a sufficient numerical score', () => {
  assert.equal(toMoodoorCandidate('no-quality', makeRawListing({ qualityScore: undefined, score: undefined, scoreReport: undefined })), null);
  assert.equal(toMoodoorCandidate('failed-score', makeRawListing({ qualityScore: 0.77, scoreReport: { status: 'REPAIR NEEDED' } })), null);
});

// ---------------------------------------------------------------------------
// Publication boundary: candidate visibility is distinct from public visibility
// ---------------------------------------------------------------------------

test('allows an eligible candidate to appear in maker Studio before an explicit Moodoor release', () => {
  const raw = makeRawListing({ moodoorPublished: false, moodoorStatus: 'unpublished' });
  assert.notEqual(toMoodoorCandidate('maker-visible', raw), null);
  assert.equal(toMoodoorListing('consumer-hidden', raw), null);
});

test('requires marketplace publication and explicit Moodoor boolean release for consumer visibility', () => {
  assert.notEqual(toMoodoorListing('released', makeRawListing({ moodoorPublished: true })), null);
  assert.equal(toMoodoorListing('draft-but-released', makeRawListing({ status: 'draft', moodoorPublished: true })), null);
});

test('recognizes Moodoor status release case-insensitively and rejects non-published release statuses', () => {
  assert.equal(toMoodoorListing('status-release', makeRawListing({ moodoorPublished: false, moodoorStatus: ' PUBLISHED ' }))?.isMoodoorPublished, true);
  for (const moodoorStatus of ['private', 'unpublished', 'review_required', undefined]) {
    assert.equal(toMoodoorListing(`not-${String(moodoorStatus)}`, makeRawListing({ moodoorPublished: false, moodoorStatus })), null);
  }
});

test('does not publish unavailable or review-required listings even when explicitly released', () => {
  assert.equal(toMoodoorListing('unavailable-public', makeRawListing({ availability: 'sold out', moodoorPublished: true })), null);
  assert.equal(toMoodoorListing('review-public', makeRawListing({ qualityScore: 0.77, moodoorPublished: true })), null);
});

// ---------------------------------------------------------------------------
// Scoring weights, minimum boundary, explanations, and ranking order
// ---------------------------------------------------------------------------

test('awards the maximum score of 1.00 for mood, season, door, and in-stock availability', () => {
  const match = singleMatch(warmWinterDarkWood, makeListing());
  assert.equal(match.score, 1);
  assert.deepEqual(match.matchedSignals, ['warm mood', 'winter fit', 'dark wood compatibility', 'in stock']);
  assert.equal(match.explanation, 'Winter Hearth was selected for its warm mood, winter fit, dark wood compatibility.');
});

test('awards each signal family once even when multiple duplicate tokens appear', () => {
  const listing = makeListing({
    title: 'Warm warm warm',
    summary: 'Warm hearth golden warm evergreen.',
    moodTags: ['warm', 'warm', 'cozy'],
    paletteTags: ['golden', 'evergreen', 'warm'],
  });
  const match = singleMatch(warmWinterDarkWood, listing);
  assert.equal(match.score, 1);
  assert.equal(match.matchedSignals.filter((signal) => signal === 'warm mood').length, 1);
  assert.equal(match.matchedSignals.filter((signal) => signal === 'dark wood compatibility').length, 1);
});

test('uses the exact standalone mood weight: baseline + mood + in-stock = 0.62', () => {
  // "cozy" is a warm-only token; it does not also satisfy the dark-wood vocabulary.
  const listing = makeListing({ title: 'Cozy Form', summary: '', seasonTags: [], moodTags: [], paletteTags: [], formula: null });
  const match = singleMatch(warmWinterDarkWood, listing);
  assertScore(match.score, 0.62);
  assert.deepEqual(match.matchedSignals, ['warm mood', 'in stock']);
});

test('uses the exact standalone season weight: baseline + season + in-stock = 0.50', () => {
  const listing = makeListing({ title: 'Winter Form', summary: 'A seasonal composition.', moodTags: [], paletteTags: [], formula: null });
  const match = singleMatch(warmWinterDarkWood, listing);
  assert.equal(match.score, 0.5);
  assert.deepEqual(match.matchedSignals, ['winter fit', 'in stock']);
});

test('uses the exact standalone door weight: baseline + door + in-stock = 0.44', () => {
  // "ivory" is a dark-wood-only token; it does not also satisfy the warm vocabulary.
  const listing = makeListing({ title: 'Ivory Form', summary: '', seasonTags: [], moodTags: [], paletteTags: ['ivory'], formula: null });
  const match = singleMatch(warmWinterDarkWood, listing);
  assertScore(match.score, 0.44);
  assert.deepEqual(match.matchedSignals, ['dark wood compatibility', 'in stock']);
});

test('rejects a limited listing with only a door match at 0.41, directly below the 0.42 floor', () => {
  const listing = makeListing({
    title: 'Ivory Form',
    summary: '',
    seasonTags: [],
    moodTags: [],
    paletteTags: ['ivory'],
    formula: null,
    availability: 'limited',
  });
  assert.deepEqual(rankMoodoorMatches(warmWinterDarkWood, [listing]), []);
});

test('accepts a limited listing with a season match at 0.47, directly above the 0.42 floor', () => {
  const listing = makeListing({
    title: 'Winter Form',
    summary: 'A seasonal composition.',
    moodTags: [],
    paletteTags: [],
    formula: null,
    availability: 'limited',
  });
  const match = singleMatch(warmWinterDarkWood, listing);
  assert.equal(match.score, 0.47);
  assert.deepEqual(match.matchedSignals, ['winter fit', 'limited availability']);
});

test('rejects listings that are unavailable or review-required at ranking time even if the catalog is malformed', () => {
  const unavailable = makeListing({ id: 'unavailable', availability: 'unavailable' });
  const reviewRequired = makeListing({ id: 'review-required', quality: 'review_required' });
  assert.deepEqual(rankMoodoorMatches(warmWinterDarkWood, [unavailable, reviewRequired]), []);
});

test('matches every controlled mood vocabulary through the shared listing corpus', () => {
  const scenarios: Array<{ profile: MoodProfile; token: string }> = [
    { profile: { mood: 'calm', season: 'spring', door: 'modern' }, token: 'serene' },
    { profile: { mood: 'warm', season: 'spring', door: 'modern' }, token: 'hearth' },
    { profile: { mood: 'dramatic', season: 'spring', door: 'modern' }, token: 'editorial' },
    { profile: { mood: 'romantic', season: 'spring', door: 'modern' }, token: 'velvet' },
    { profile: { mood: 'natural', season: 'spring', door: 'modern' }, token: 'botanical' },
    { profile: { mood: 'festive', season: 'spring', door: 'modern' }, token: 'holiday' },
  ];

  for (const { profile, token } of scenarios) {
    const match = singleMatch(profile, makeListing({ title: `${token} form`, summary: '', seasonTags: [], moodTags: [], paletteTags: [], formula: null }));
    assertScore(match.score, 0.62, `${profile.mood} should contribute exactly its 0.34 mood weight.`);
    assert.deepEqual(match.matchedSignals, [`${profile.mood} mood`, 'in stock']);
  }
});

test('matches every controlled door vocabulary through the shared listing corpus', () => {
  const scenarios: Array<{ door: MoodProfile['door']; token: string }> = [
    { door: 'dark-wood', token: 'ivory' },
    { door: 'painted-light', token: 'blue' },
    { door: 'modern', token: 'architectural' },
    { door: 'rustic', token: 'harvest' },
    { door: 'neutral', token: 'balanced' },
  ];

  for (const { door, token } of scenarios) {
    const profile: MoodProfile = { mood: 'warm', season: 'winter', door };
    const match = singleMatch(profile, makeListing({ title: `${token} form`, summary: '', seasonTags: [], moodTags: [], paletteTags: [], formula: null }));
    assertScore(match.score, 0.44, `${door} should contribute exactly its 0.16 compatibility weight.`);
    assert.deepEqual(match.matchedSignals, [`${door.replace('-', ' ')} compatibility`, 'in stock']);
  }
});

test('normalizes underscores and hyphens while matching season and formula text', () => {
  const listing = makeListing({
    title: 'Quiet Form',
    summary: '',
    seasonTags: ['winter-season'],
    moodTags: ['warm_welcome'],
    paletteTags: ['golden'],
    formula: 'crescent_sweep',
  });
  const match = singleMatch(warmWinterDarkWood, listing);
  assert.equal(match.score, 1);
});

test('orders equal-score matches alphabetically by title', () => {
  const alpha = makeListing({ id: 'alpha', title: 'Alpha Wreath', formula: 'alpha' });
  const zulu = makeListing({ id: 'zulu', title: 'Zulu Wreath', formula: 'zulu' });
  const results = rankMoodoorMatches(warmWinterDarkWood, [zulu, alpha]);
  assert.deepEqual(results.map((result) => result.listing.id), ['alpha', 'zulu']);
});

test('orders a higher score ahead of an alphabetically earlier lower-score match', () => {
  const stronger = makeListing({ id: 'stronger', title: 'Zulu High', formula: 'high' });
  const weaker = makeListing({
    id: 'weaker',
    title: 'Alpha Low',
    summary: 'Warm and welcoming only.',
    seasonTags: [],
    paletteTags: [],
    formula: 'low',
  });
  const results = rankMoodoorMatches(warmWinterDarkWood, [weaker, stronger]);
  assert.deepEqual(results.map((result) => result.listing.id), ['stronger', 'weaker']);
});

test('deduplicates formulas after score ordering using normalized hyphen and underscore variants', () => {
  const highest = makeListing({ id: 'highest', title: 'Highest', formula: 'crescent-sweep' });
  const duplicate = makeListing({
    id: 'duplicate',
    title: 'Duplicate',
    formula: 'crescent_sweep',
    summary: 'Warm only.',
    seasonTags: [],
    paletteTags: [],
  });
  const distinct = makeListing({ id: 'distinct', title: 'Distinct', formula: 'full-ring' });
  const results = rankMoodoorMatches(warmWinterDarkWood, [duplicate, distinct, highest]);
  assert.deepEqual(results.map((result) => result.listing.id), ['distinct', 'highest']);
});

test('uses normalized titles as the diversity key when formula is null', () => {
  const one = makeListing({ id: 'one', title: 'Same Title', formula: null });
  const two = makeListing({ id: 'two', title: 'same-title', formula: null });
  const three = makeListing({ id: 'three', title: 'Different Title', formula: null });
  const results = rankMoodoorMatches(warmWinterDarkWood, [one, two, three]);
  assert.deepEqual(results.map((result) => result.listing.id), ['three', 'one']);
});

test('caps output at three distinct formulae after all scoring and diversity rules', () => {
  const entries = ['alpha', 'beta', 'gamma', 'delta'].map((formula, index) => makeListing({
    id: formula,
    title: `${formula}-${index}`,
    formula,
  }));
  const results = rankMoodoorMatches(warmWinterDarkWood, entries);
  assert.equal(results.length, 3);
  assert.deepEqual(results.map((result) => result.listing.id), ['alpha', 'beta', 'delta']);
});

let failures = 0;
for (const { name, run } of cases) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`\n${failures}/${cases.length} Moodoor matcher integration tests failed.`);
  process.exitCode = 1;
} else {
  console.log(`\n${cases.length} Moodoor matcher integration tests passed.`);
}
