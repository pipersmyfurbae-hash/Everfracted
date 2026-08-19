import assert from 'node:assert/strict';
import { rankMoodoorMatches, toMoodoorCandidate, toMoodoorListing, type MoodoorListing } from '../services/moodoorMatching';

const approvedListing: MoodoorListing = {
  id: 'warm-winter',
  title: 'Winter Hearth',
  summary: 'An evergreen wreath with cedar, warm brass, and a quiet familiar glow.',
  imageUrl: null,
  price: 148,
  currency: 'USD',
  seasonTags: ['winter'],
  moodTags: ['warm', 'nostalgia', 'quiet'],
  paletteTags: ['evergreen', 'golden'],
  formula: 'crescent',
  availability: 'in_stock',
  quality: 'approved',
  publishedAt: null,
  isMoodoorPublished: true,
};

const alternativeListing: MoodoorListing = {
  ...approvedListing,
  id: 'winter-contrast',
  title: 'Night Garden',
  summary: 'A deep, architectural winter design with strong contrast.',
  moodTags: ['dramatic'],
  paletteTags: ['deep', 'black'],
  formula: 'asymmetric',
};

const excludedListing: MoodoorListing = {
  ...approvedListing,
  id: 'sold-out',
  title: 'Sold Out Example',
  availability: 'unavailable',
};

const matches = rankMoodoorMatches(
  { mood: 'warm', season: 'winter', door: 'dark-wood' },
  [alternativeListing, excludedListing, approvedListing],
);

assert.equal(matches.length, 2, 'Unavailable listings must never surface.');
assert.equal(matches[0].listing.id, 'warm-winter', 'The strongest mood, season, and door fit must rank first.');
assert.ok(matches[0].explanation.includes('Winter Hearth'), 'Every match must include a customer-safe explanation.');

const marketplaceBase = {
  status: 'published',
  title: 'Winter Hearth',
  description: 'Cedar and warm brass.',
  qualityScore: 0.84,
  availability: 'in stock',
};

assert.equal(toMoodoorListing('not-released', marketplaceBase), null, 'Marketplace publication alone must not make a listing public in Moodoor.');
assert.equal(toMoodoorCandidate('eligible', marketplaceBase)?.quality, 'approved', 'The quality threshold must allow an approved candidate.');
assert.equal(toMoodoorCandidate('below-quality', { ...marketplaceBase, qualityScore: 0.74 }), null, 'Below-threshold candidates must be excluded.');
assert.equal(toMoodoorListing('released', { ...marketplaceBase, moodoorPublished: true })?.isMoodoorPublished, true, 'A deliberate Moodoor release must be recognized.');

console.log('Moodoor matching fixtures passed.');
