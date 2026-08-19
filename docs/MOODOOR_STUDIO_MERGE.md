# Moodoor Studio × Everfracted Integration

## Purpose

Moodoor Studio has been integrated into Everfracted as a **shared-data, separate-experience** capability. Evercrafted remains the maker-facing source of truth; Moodoor provides a consumer-facing matching experience and an authenticated maker publishing surface.

The import deliberately avoids placing the archive’s standalone Wouter/Vite runtime beside Everfracted as a competing application. Instead, the implemented routes and services adopt the archive’s durable product principles: explicit public publishing, safe public snapshots, approved-design gating, privacy-first matching, and a distinct customer-facing editorial voice.

## Archive Audit

The uploaded `moodoor-studio.zip` was inspected without executing its source code. It is a complete React/Vite/Express workspace with a Wouter router, local prototype repositories, a public-facing Moodoor experience, a creator Studio shell, publishing workflows, and deterministic memory matching.

| Archive capability | Archive evidence | Integration disposition | Rationale |
|---|---|---|---|
| Public customer pages | `client/src/pages/PublicPages.tsx` | **Adapted** | The new finder carries its consumer-safe presentation and matching principles into Everfracted’s React Router. |
| Public publishing boundary | `client/src/data/publishing.ts` | **Adapted** | Explicit maker release, approved-source gating, no internal data exposure, and stale-safe behaviour are mapped to marketplace listings. |
| Deterministic memory matching | `client/src/data/memoryMatching.ts` | **Adapted** | Mood, season, and door matching is deterministic, explainable, and fixture-tested; no opaque model is required for the MVP. |
| Full internal Studio shell | `client/src/App.tsx` and many Studio pages | **Not copied wholesale** | The archive uses a separate Wouter runtime and local browser storage. Everfracted already owns authenticated navigation, tiers, Firebase, and maker workflows. |
| Local browser repositories | `client/src/data/*` | **Excluded from production data** | Everfracted’s Firestore marketplace collection is the shared source of truth; browser storage would create divergent catalogue state. |
| Story/collection/launch tooling | Archive collection, campaign, launch, and lookbook modules | **Deferred** | These are valuable future adapters once authoritative production schemas and maker workflows are available in Everfracted. |
| Assets and third-party dependencies | Archive manifest and package manifest | **Extract assets only if provenance is approved** | No archive dependency or asset was added solely by copying it from the ZIP. |

The full archive manifest is preserved in `docs/moodoor-studio-archive-manifest.txt` for review.

## Implemented Routes

| Route | Audience | Purpose | Access |
|---|---|---|---|
| `/moodoor` | Consumer | Existing Moodoor landing page; CTAs now enter the finder. | Public |
| `/moodoor/find` | Consumer | Three-step mood, season, and door flow; ranks only publishable Moodoor listings. | Public |
| `/app/moodoor-studio` | Maker | Review marketplace designs eligible for Moodoor and deliberately release or remove them. | Studio tier or administrator |

## Data Boundary

### Firestore source

The integration reads from the existing `marketplace_listings` collection. A listing is eligible for the creator Studio only when it is marketplace-published, currently available, and quality-approved. It becomes visible to consumers only after a maker explicitly releases it by setting `moodoorPublished: true` and `moodoorStatus: 'published'`.

### Consumer-safe projection

`services/moodoorMatching.ts` exposes only the following data to Moodoor pages:

| Consumer field | Source concept | Never exposed |
|---|---|---|
| Title and summary | Marketplace title/description | Internal notes, supplier data |
| Image | Approved render / product image URL | Unapproved render assets |
| Price | Marketplace price | Cost and margin data |
| Availability label | Normalized availability state | Raw inventory quantity |
| Mood, season, palette, formula descriptors | Public product tags | Coordinates, collision data, production details |
| Match explanation | Deterministic match factors | Internal score components and raw confidence values |

### Publication lifecycle

`marketplace published → quality approved → maker releases to Moodoor → consumer-visible`

A listing is excluded from Moodoor when any of the following is true:

- its marketplace status is not `published`;
- it has not been deliberately released to Moodoor;
- its availability normalizes to unavailable/sold out/discontinued;
- it has no explicit approval or fails the 0.78 quality gate.

## Matching Behaviour

The current version is intentionally deterministic and explainable. It compares three customer choices to public listing metadata:

1. **Mood** contributes the primary emotional match.
2. **Season or occasion** contributes a contextual fit.
3. **Door context** compares expected palette and style compatibility.
4. **Availability and quality** act as hard eligibility gates.
5. **Formula diversity** avoids near-duplicate alternatives.

The customer receives a short reason in plain language. Product, inventory, and composition internals remain private.

## Source Files Added or Changed

| File | Change |
|---|---|
| `pages/Moodoor.tsx` | New consumer finder and maker publishing Studio pages. |
| `services/moodoorMatching.ts` | Firestore adapter, eligibility gate, public projection, deterministic ranker, and controlled vocabularies. |
| `services/geminiClient.ts` | Lazy optional AI client; prevents unconfigured browser AI features from blocking unrelated routes. |
| `scripts/test-moodoor-matching.ts` | Fixture validation for publication and matching rules. |
| `App.tsx` | Public `/moodoor/find` and authenticated `/app/moodoor-studio` routes. |
| `components/Layout.tsx` | Studio-tier maker navigation entry. |
| `pages/MoodoorLanding.tsx` | Consumer CTAs route to the merged finder. |
| `lib/firebase.ts`, `index.html`, `vite.config.ts`, `tsconfig.json` | Corrected pre-existing root-source resolution so the integrated application builds. |
| Existing AI page modules | Deferred eager browser AI client initialization to prevent unrelated route failures without a configured API key. |

## Validation Completed

- The uploaded archive was listed and catalogued before source extraction; no archive script was executed.
- The integrated Moodoor matcher fixture suite passes.
- A Vite production build completes successfully.
- The public `/moodoor/find` route was opened in a browser and its first two steps were exercised successfully.

## Follow-up Work

1. Add Firestore security rules that permit public reads only of a dedicated public Moodoor projection or a securely filtered view, rather than relying on client filtering for privacy boundaries.
2. Add explicit marketplace fields for `moodTags`, `seasonTags`, `palette`, `availability`, and a quality approval record when designs are published.
3. Move consumer matching to a server-side or callable function before real commerce launch, so client code cannot access unprojected marketplace fields.
4. Add a dedicated Moodoor product detail route and a Story Drop adapter linked to an approved blueprint version.
5. Add maker-facing review controls for image approval, public story copy, price/availability, and publication history.
6. Add code splitting for larger app routes; the Vite build currently emits a chunk-size warning over 500 kB.
