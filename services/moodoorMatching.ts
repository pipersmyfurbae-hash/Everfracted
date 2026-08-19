import { collection, getDocs, query, updateDoc, where, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  toMoodoorCandidate,
  toMoodoorListing,
  type MarketplaceDocument,
} from './moodoorProjection';
import type { MoodoorListing } from './moodoorMatchingCore';

export {
  doorChoices,
  moodChoices,
  moodoorQualityThreshold,
  rankMoodoorMatches,
  seasonChoices,
  type DoorId,
  type MoodId,
  type MoodoorListing,
  type MoodoorMatch,
  type MoodProfile,
  type SeasonId,
} from './moodoorMatchingCore';

export {
  isPublishedForMoodoor,
  resolveMoodoorAvailability,
  resolveMoodoorQuality,
  toMoodoorCandidate,
  toMoodoorListing,
  type MarketplaceDocument,
} from './moodoorProjection';

/**
 * Current browser adapter. It remains backwards compatible while the server
 * public-projection API is introduced; production consumers should migrate to
 * the server endpoint rather than reading raw marketplace documents.
 */
export async function getMoodoorCatalog(): Promise<MoodoorListing[]> {
  const snapshot = await getDocs(query(collection(db, 'marketplace_listings'), where('status', '==', 'published')));
  return snapshot.docs
    .map((entry) => toMoodoorListing(entry.id, entry.data() as MarketplaceDocument))
    .filter((entry): entry is MoodoorListing => entry !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Maker view of eligible designs, including records not yet released to Moodoor. */
export async function getCreatorMoodoorListings(creatorId: string): Promise<MoodoorListing[]> {
  const snapshot = await getDocs(query(collection(db, 'marketplace_listings'), where('creatorId', '==', creatorId)));
  return snapshot.docs
    .map((entry) => toMoodoorCandidate(entry.id, entry.data() as MarketplaceDocument))
    .filter((entry): entry is MoodoorListing => entry !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Legacy client-side publication adapter. The ecosystem API will supersede
 * this write so quality, availability, ownership, and audit events are
 * enforced together in a server transaction.
 */
export async function setMoodoorPublication(listingId: string, publish: boolean): Promise<void> {
  await updateDoc(doc(db, 'marketplace_listings', listingId), {
    moodoorPublished: publish,
    moodoorStatus: publish ? 'published' : 'unpublished',
    moodoorUpdatedAt: serverTimestamp(),
  });
}
