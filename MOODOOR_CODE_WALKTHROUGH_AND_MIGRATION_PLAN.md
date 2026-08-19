# Moodoor Matching Code Walkthrough and Platform Migration Plan

## Scope

This reference explains the current `services/moodoorMatching.ts` implementation in execution order, then specifies an additive migration from client-filtered marketplace reads to a secure, server-managed public Moodoor projection. The recommendations preserve the existing product invariants: explicit release, the `0.78` quality gate, public-safe results, explainable matching, and no duplicate editable catalog.

> **Current state:** `marketplace_listings` is a Firestore collection written directly by `publishToMarketplace`, which spreads an entire `Blueprint` into the listing document and assigns `price`, `creatorId`, `createdAt`, and `status: 'published'`.[1] Moodoor currently queries published marketplace records in the browser, filters them locally, and ranks them locally.[2]

## Part I — Exact `moodoorMatching.ts` Execution Walkthrough

### Step 1 — Define the legal input space

Lines 4–12 establish three string-union types: `MoodId`, `SeasonId`, and `DoorId`. The `MoodProfile` interface requires exactly one value from each category. This makes the finder’s three-choice input predictable and lets TypeScript prevent unsupported values from being passed to the ranker.[2]

| Code region | Responsibility | Runtime effect |
|---|---|---|
| Lines 4–6 | `MoodId`, `SeasonId`, `DoorId` unions | Constrains allowed customer choices. |
| Lines 8–12 | `MoodProfile` | Requires mood, season, and door before a ranking call. |
| Lines 14–29 | `MoodoorListing` | Defines the safe projection the customer UI reads. |
| Lines 31–36 | `MoodoorMatch` | Returns a listing plus score, explanation, and recorded signals. |

The page-level finder enforces completeness before it queries: `findMatches()` returns early unless mood, season, and door are all set. It then calls `getMoodoorCatalog()` and passes that result into `rankMoodoorMatches()`.[3]

### Step 2 — Accept a permissive source document, then narrow it

Lines 38–65 define `MarketplaceDocument`. It is deliberately tolerant of the current legacy source because marketplace records may use different fields for the same concept: `title` or `name`, `summary` or `description`, `imageUrl`, `image_url`, or `renderUrl`, and multiple tag aliases.

The tolerance belongs in the adapter layer, not in the customer UI. `toMoodoorCandidate()` consolidates these variations into one `MoodoorListing` contract at lines 131–153.[2]

### Step 3 — Normalize tags before matching

Four small helpers make the ranker deterministic.

| Function | Lines | Exact behaviour |
|---|---:|---|
| `asStringArray` | 86–91 | Preserves string arrays, wraps a single string, extracts string values from an object, otherwise returns `[]`. |
| `normalize` | 93–95 | Trims, lowercases, and replaces `_` and `-` with spaces. |
| `hasAny` | 97–100 | Normalizes every candidate text field, joins them with spaces, and returns true when any selected signal is a substring. |
| `listingText` | 102–104 | Builds the candidate corpus from title, summary, formula, season tags, mood tags, and palette tags. |

The design is intentionally substring-based. It does **not** tokenize on word boundaries, calculate embeddings, or count frequency. A signal family either matches once or does not match.[2]

### Step 4 — Normalize availability

`resolveAvailability()` at lines 106–111 reads `raw.availability`, falls back to `raw.inventoryStatus`, then falls back to the literal string `in stock`.

1. It returns `unavailable` if the normalized value contains `out`, `out of stock`, `sold out`, `unavailable`, or `discontinued`.
2. If not unavailable, it returns `limited` if it contains `low`, `limited`, or `few remaining`.
3. Every other value is `in_stock`.

The ordering matters: an unavailable phrase always wins before a limited phrase is considered.[2]

### Step 5 — Resolve quality with a hard threshold

`resolveQuality()` at lines 113–123 accepts several current score shapes without changing the downstream rule.

```ts
const score = raw.qualityScore ?? raw.score ?? raw.scoreReport?.total ?? null;
const explicitApproval = raw.qualityApproved === true
  || normalize(String(raw.scoreReport?.status || '')) === 'pass';

return explicitApproval || (score !== null && score >= 0.78)
  ? 'approved'
  : 'review_required';
```

The actual TypeScript uses ternaries rather than nullish coalescing, but the logic is equivalent. Explicit approval overrides a numerical absence or a score below the threshold. Without approval, a numerical score of at least `MINIMUM_QUALITY_SCORE`, set to `0.78` at line 67, is required.[2]

### Step 6 — Separate “maker candidate” from “consumer listing”

Two adapter functions create a critical boundary.

| Function | Lines | Purpose |
|---|---:|---|
| `toMoodoorCandidate` | 131–153 | Produces a maker-visible candidate if marketplace status is `published`, availability is not `unavailable`, and quality is `approved`. It does **not** require an explicit Moodoor release. |
| `toMoodoorListing` | 155–158 | Applies `isPublishedForMoodoor()` first, then delegates to `toMoodoorCandidate()`. It therefore requires marketplace publication **and** explicit Moodoor release. |

`isPublishedForMoodoor()` at lines 125–129 returns true only when `status` normalizes to `published` and either `moodoorPublished === true` or `moodoorStatus` normalizes to `published`. Marketplace publication by itself never makes a record consumer-visible.[2]

### Step 7 — Query Firestore in two views

`getMoodoorCatalog()` at lines 160–166 runs a Firestore query for records where `status == 'published'`. It maps each record through `toMoodoorListing()`, drops null results, and alphabetically sorts titles. That alphabetical sort is not the customer rank; it supplies a stable initial catalog before scoring.[2]

`getCreatorMoodoorListings()` at lines 168–174 instead queries records where `creatorId == creatorId`, maps through `toMoodoorCandidate()`, drops nulls, and alphabetically sorts. This is the maker Studio view of eligible listings, including records not yet released to customers.[2]

### Step 8 — Toggle explicit release

`setMoodoorPublication()` at lines 176–182 performs a direct Firestore update:

```ts
moodoorPublished: publish,
moodoorStatus: publish ? 'published' : 'unpublished',
moodoorUpdatedAt: serverTimestamp(),
```

The maker UI calls this function with the inverse of `listing.isMoodoorPublished`, then reloads the maker list. The current write is client-side; the migration plan moves the gate enforcement into a server-controlled endpoint and transaction.[2] [3]

### Step 9 — Score surviving listings

`rankMoodoorMatches()` at lines 184–227 is the ranking pipeline.

1. **Filter again.** Lines 185–186 retain only listings whose normalized availability is not `unavailable` and whose quality is `approved`. This is a defense-in-depth check even though the catalog adapter already filtered them.
2. **Construct public text.** Line 188 calls `listingText(listing)`.
3. **Initialize baseline.** Lines 189–190 create an empty `signals` array and set `score = 0.22`.
4. **Mood signal.** Lines 192–195 add `0.34` once if any selected mood token appears in the text corpus, then record `"{mood} mood"`.
5. **Season signal.** Lines 196–199 add `0.22` once when the selected season appears in `seasonTags` or anywhere in the corpus, then record `"{season} fit"`.
6. **Door signal.** Lines 200–203 add `0.16` once if a selected door’s compatibility vocabulary appears in the corpus, then record `"{door} compatibility"`.
7. **Availability signal.** Lines 204–210 add `0.06` for `in_stock` or `0.03` for `limited`, with a corresponding signal label.
8. **Build explanation.** Lines 212–214 use only the first three recorded signals. If no signals are recorded, the fallback explanation says the design is a balanced available option.
9. **Cap score.** Line 215 applies `Math.min(1, score)`.
10. **Threshold and order.** Lines 217–218 drop scores below `0.42`, then order descending by score and alphabetically by title for exact ties.
11. **Diversify.** Lines 220–226 use a `Set` of normalized formulas, falling back to normalized titles. A duplicate formula is discarded; the result is capped at three listings.

The implemented formula is therefore:

\[
\text{score} = \min\left(1.00,\ 0.22 + 0.34M + 0.22S + 0.16D + A\right)
\]

where `M`, `S`, and `D` are each either `0` or `1`, and `A` is `0.06` for in-stock or `0.03` for limited availability. A maximal in-stock match is `1.00`; a candidate needs at least `0.42` to survive.[2]

### Step 10 — Export the finder vocabulary and threshold

Lines 229–254 export UI-facing `moodChoices`, `seasonChoices`, `doorChoices`, and `moodoorQualityThreshold`. This is why the finder displays exactly six mood options, five seasonal options, and five door types; the UI does not duplicate the ranking vocabulary.[2] [3]

## Part II — Database Schema Migration Plan

### Target architecture

The target model separates the **canonical private listing** from a **server-generated public read model**. This preserves Evercrafted as the source of truth while ensuring public client code never needs permission to read raw marketplace documents.

```text
canonical marketplace_listings/{listingId}
      │  authoritative maker record
      │  server validation + projection worker
      ▼
moodoor_public_listings/{listingId}
      │  public-safe, read-only projection
      ▼
POST /api/v1/moodoor/matches
      │  ranking at the server boundary
      ▼
consumer finder response
```

### Collection and schema design

| Collection | Writer | Reader | Purpose |
|---|---|---|---|
| `marketplace_listings` | Authenticated owner through server API; administrators | Owner, administrator, server | Canonical maker listing, full blueprint references, private inventory and quality context. |
| `moodoor_public_listings` | Server-only projection worker | Public API only; optionally public Firestore read if documents contain no private fields | Customer-safe read model and match corpus. Not an editable duplicate. |
| `moodoor_publication_events` | Server-only | Owner, administrator, server | Immutable publication/audit history: release, unpublish, quality revocation, projection failure. |
| `moodoor_match_sessions` | Server-only and TTL-managed | Server only | Optional privacy-limited aggregate and troubleshooting record. Do not store raw memories by default. |
| `schema_migrations` | Deployment process only | Administrator, server | Idempotent migration checkpoints, batch counts, schema versions, and rollback state. |

### Canonical listing v2 contract

Add fields without deleting the current blueprint payload during the first release.

| Field | Type | Required at final cutover | Notes |
|---|---|---:|---|
| `schemaVersion` | `'marketplace_listing.v2'` | Yes | Enables deterministic adapters and backfill reporting. |
| `listingId` | string | Yes | Equal to Firestore document ID. |
| `creatorId` | string | Yes | Existing ownership field. |
| `marketplace.status` | `'draft' \| 'published' \| 'archived'` | Yes | Replaces ambiguous top-level status incrementally. |
| `quality.score` | number \| null | Yes | Canonical total score. |
| `quality.status` | `'pass' \| 'repair_needed' \| 'unknown'` | Yes | Canonical approval state; maps from current `ScoreReport`. |
| `quality.approvedAt` | timestamp \| null | Yes | Human/system approval audit. |
| `availability.status` | `'in_stock' \| 'limited' \| 'unavailable'` | Yes | Server-normalized; no raw count exposed publicly. |
| `availability.updatedAt` | timestamp | Yes | Supports stale-data detection. |
| `moodoor.status` | `'private' \| 'published' \| 'unpublished' \| 'revoked'` | Yes | Replaces split boolean/string release state. |
| `moodoor.publishedAt` | timestamp \| null | Yes | Explicit release audit. |
| `moodoor.publishedBy` | string \| null | Yes | Maker/admin audit. |
| `public.title`, `public.summary`, `public.heroImageUrl`, `public.price` | public content | Yes | Customer-safe display fields. |
| `public.moodTags`, `public.seasonTags`, `public.paletteTags`, `public.formula` | string arrays/string | Yes | Structured matching contract. |
| `blueprintRef` | `{ blueprintId, revision }` | Yes | Avoids spreading the full blueprint as a marketplace contract. |

### Public projection v1 contract

`moodoor_public_listings/{listingId}` contains only what the client needs and never raw inventory, supplier, cost, blueprint, score breakdown, owner notes, or internal approval rationale.

```ts
interface MoodoorPublicListingV1 {
  schemaVersion: 'moodoor_public_listing.v1';
  listingId: string;
  slug: string;
  title: string;
  summary: string;
  heroImageUrl: string | null;
  price: { amount: number | null; currency: 'USD' };
  availability: 'in_stock' | 'limited';
  formula: string | null;
  moodTags: string[];
  seasonTags: string[];
  paletteTags: string[];
  publishedAt: Timestamp;
  sourceVersion: { listingSchema: 'marketplace_listing.v2'; listingUpdatedAt: Timestamp };
}
```

### Indexes and data constraints

| Need | Recommended implementation |
|---|---|
| Maker Studio list | Composite index on `marketplace_listings(creatorId ASC, marketplace.status ASC, updatedAt DESC)`. |
| Public retrieval | Composite index on `moodoor_public_listings(availability ASC, publishedAt DESC)` if public filters/sorts are exposed. |
| Slug resolution | Store normalized unique slug; enforce uniqueness in a server transaction or dedicated `moodoor_slugs/{slug}` reservation document. |
| Publication race protection | Use a Firestore transaction that reads the canonical listing, validates ownership/gates, updates `moodoor.status`, writes projection, and appends event. |
| Projection integrity | Store `sourceVersion.listingUpdatedAt`; rebuild on canonical write and revoke projection when quality/availability/release validity changes. |

## Part III — API Route Migration Plan

### API principles

All new routes use `/api/v1`. The public matcher accepts only the controlled three-field profile and returns the public projection plus an explanation. It never returns raw scores or unrestricted Firestore documents. Maker routes verify Firebase ID tokens, ownership, entitlement, and current quality/availability within the server transaction.

| Route | Caller | Contract | Enforcement |
|---|---|---|---|
| `POST /api/v1/moodoor/matches` | Public finder | `{ mood, season, door }` → up to three public match objects | Validate enum values; query only public projection; rank server-side; rate-limit. |
| `GET /api/v1/moodoor/listings/:slug` | Public detail page | Public listing projection | Read only published safe document; 404 otherwise. |
| `GET /api/v1/moodoor/studio/listings` | Studio maker | Cursor pagination and filters | Verify ID token and Studio entitlement; restrict to creator. |
| `PATCH /api/v1/moodoor/studio/listings/:id/publication` | Studio maker | `{ action: 'publish' \| 'unpublish' }` | Verify owner/admin, quality `pass` or score ≥ 0.78, availability, marketplace status; transactionally update canonical state/projection/event. |
| `POST /api/v1/marketplace/listings` | Authenticated maker | Canonical v2 creation request | Normalize tags, validate blueprint reference and price, create canonical listing. |
| `PATCH /api/v1/marketplace/listings/:id` | Authenticated owner/admin | Canonical v2 partial update | Validate allowed fields; rebuild/revoke projection if publish-critical fields change. |
| `POST /api/v1/internal/moodoor/rebuild-projection` | Admin/job worker | `{ listingId }` | Internal-only repair endpoint for projection retries. |

### Public match response

```json
{
  "matches": [
    {
      "listing": {
        "slug": "winter-hearth",
        "title": "Winter Hearth",
        "summary": "An evergreen wreath with cedar and warm brass.",
        "heroImageUrl": "https://…",
        "price": { "amount": 148, "currency": "USD" },
        "availability": "in_stock",
        "formula": "crescent"
      },
      "explanation": "Winter Hearth was selected for its warm mood, winter fit, dark wood compatibility.",
      "matchedSignals": ["warm mood", "winter fit", "dark wood compatibility"]
    }
  ],
  "noMatch": false
}
```

The public response intentionally omits `score` even though the server calculates it. This matches the existing product boundary: customer pages should receive an explanation, not internal score components.[2] [3]

## Part IV — Phased Rollout and Backfill

| Phase | Database work | API/UI work | Exit criteria | Rollback |
|---|---|---|---|---|
| 0. Contract freeze | Define v2 enums, projection contract, rules, and migration checklist. | Add feature flags: `moodoorServerMatches`, `moodoorPublicProjection`. | Contract reviewed; no production writes changed. | Disable flags. |
| 1. Additive schema | Add nullable v2 fields and `schemaVersion` to canonical listings. Create new collections/indexes. | Deploy server validators behind no-op routes. | Existing screens still read legacy fields. | Ignore v2 fields; no destructive migration. |
| 2. Backfill and classify | Batch-convert legacy aliases; calculate normalized availability; map score shapes; report records missing public tags, quality, or image. | Studio shows readiness reasons, but legacy finder remains active. | Backfill report reconciles source counts and exceptions. | Retain legacy document fields and rerun an idempotent batch. |
| 3. Server projection | Build `moodoor_public_listings` from canonical eligible records and append publication events. | Add server Studio publication API; dual-write canonical and projection in a transaction. | Projection count and sampled values match eligible canonical listings. | Turn off projection consumer reads; canonical records remain intact. |
| 4. Shadow matching | Run current client ranker and server ranker against the same controlled test catalog; log normalized output diffs. | Keep client results user-facing while server responses are observed. | Zero unexplained ranking or eligibility diffs. | Continue legacy flow. |
| 5. Cutover | Make public projection authoritative for consumer reads. Restrict raw marketplace reads. | Enable `POST /moodoor/matches`; switch finder and public detail pages. | Error/rate-limit dashboards stable; audit events complete. | Route feature flag to legacy finder while public projection remains. |
| 6. Decommission | Remove legacy alias fallback only after agreed retention period; version adapters. | Remove direct client publication writes; keep deprecated endpoint telemetry. | No legacy field/API traffic for the agreed interval. | Restore adapter compatibility release if needed. |

## Security Rules and Operational Controls

The current client query of `marketplace_listings` is appropriate for an MVP demonstration but is not the preferred production privacy boundary because Firestore rules cannot safely transform documents. At cutover, enforce these controls:

1. **Canonical listing rules:** only the authenticated owner or an administrator may read/write a raw listing; client writes may be blocked entirely in favor of server APIs.
2. **Public projection rules:** if Firestore serves it directly, only documents that are already public-safe may be readable. Prefer the API for matching, rate limiting, and future ranking evolution.
3. **Server transaction:** publication must atomically validate marketplace status, quality, availability, owner, and entitlement; then write canonical publication state, public projection, and event.
4. **Audit trail:** publication and revocation events include actor, timestamp, source listing revision, action, and reason code. Avoid copying private data into event payloads.
5. **Observability:** track candidate count, exclusion reason counts, match distribution, no-match rate, projection lag, and server/client ranking divergence during shadow mode.

## Test Plan

| Test layer | Required cases |
|---|---|
| Unit | All `moodSignals` and `doorSignals`; each score increment; cap at 1.00; `< 0.42` rejection; formula deduplication; title tie-breaker; availability normalization ordering. |
| Adapter | Each legacy alias (`name`/`title`, `description`/`summary`, image/tag variants); `scoreReport.status` casing; malformed arrays/objects. |
| API | Invalid enum input; unauthenticated Studio call; non-owner publication; below-0.78 publication; unavailable publication; idempotent publish/unpublish; cursor pagination. |
| Security | Public endpoint cannot return raw inventory, cost, blueprint, or internal score details; canonical Firestore read denial for unauthenticated user. |
| Migration | Dry-run count reconciliation; retry-safe batches; duplicate slug collision; cutover/rollback under feature flags; projection rebuild after quality revocation. |

## References

[1] [`services/firebase/marketplaceService.ts`](services/firebase/marketplaceService.ts), current direct Firestore marketplace publishing implementation.

[2] [`services/moodoorMatching.ts`](services/moodoorMatching.ts), current Moodoor data adapter, eligibility logic, and ranking implementation.

[3] [`pages/Moodoor.tsx`](pages/Moodoor.tsx), current customer finder and maker Studio invocation flow.

[4] [`types.ts`](types.ts), existing Blueprint and ScoreReport TypeScript contracts.

[5] [`server.ts`](server.ts), current Express/Firebase Admin server surface and API versioning migration seam.
