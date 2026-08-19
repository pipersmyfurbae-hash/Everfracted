# Everfracted Ecosystem Architecture and Delivery Boundary

## Decision

The ecosystem will **evolve the existing Everfracted repository** rather than introduce a competing application runtime. The current Vite/React client, Firebase Authentication, Firestore, Firebase Storage, Express service, composition engines, and Moodoor work remain the delivery foundation.

> Evercrafted is the private maker operating system. Moodoor is the consumer-facing editorial projection. Both are derived from one canonical data model; neither owns a duplicate editable catalogue.

## Audit Summary

| Existing asset | Keep and strengthen | Required change |
|---|---|---|
| React route map | Public marketing, authenticated maker shell, Moodoor finder, Moodoor Studio | Replace mock marketplace/detail routes with authoritative data routes. |
| Firebase Authentication | Google sign-in and user document bootstrap | Normalize roles and tiers; enforce entitlement server-side rather than relying on route visibility. |
| Firestore | Inventory, blueprints, marketplace listings, user records | Introduce canonical v2 schemas, public projections, publication events, and strict rules. |
| Composition workflow | Blueprint compiler and orchestrator | Persist blueprint revisions, quality reports, inventory reservations, and builder outputs. |
| Moodoor | Finder, maker release workspace, deterministic matcher | Move public data projection and matching to server-controlled APIs before launch. |
| Marketplace | Thin direct publish helper; mock browse/detail pages | Replace with canonical listing lifecycle, real browse/detail API, and later checkout adapter. |
| Express service | Existing blueprint, motion, and vision endpoints | Add authenticated `/api/v1` modules, request validation, ownership checks, and error contracts. |

## Target Product Surfaces

| Surface | Audience | Core responsibility | Data boundary |
|---|---|---|---|
| Evercrafted Maker Studio | Bloom, Craft, Studio, and Atelier subscribers | Inventory, emotion briefs, deterministic design generation, repair, quality review, builder guides, collection management. | Reads/writes owned canonical records. |
| Marketplace Publisher | Studio and Atelier makers | Listing draft, public metadata, price, quality approval, availability, Moodoor release, publication history. | Writes canonical listing records; never writes public projection directly. |
| Moodoor Studio | Studio and Atelier makers | Deliberately release eligible approved listings to customer discovery. | Uses publication API and publication-event history. |
| Moodoor Consumer | Public visitor | Feeling → season → door discovery, curated edit, public product detail. | Reads only public-safe projection and match response. |
| Administration | Administrators | Quality review, content policy, approvals, monitoring, migration remediation. | Reads platform records through privileged server routes. |

## Canonical Data Domains

| Domain | Canonical collection | Essential state | Public projection |
|---|---|---|---|
| Identity and entitlements | `users/{uid}` and server-managed entitlement claims | role, tier, subscription state, usage windows | No |
| Inventory | `inventory_items/{id}` | ownership, item metadata, on-hand quantity, reorder threshold, reservations | No |
| Blueprint | `blueprints/{id}` + `blueprint_revisions/{id}` | seeded input, formula, placements, quality report, builder guide, render refs | No |
| Marketplace listing | `marketplace_listings/{id}` | listing status, owner, public metadata, price, availability, quality, blueprint reference | No direct public read |
| Moodoor public listing | `moodoor_public_listings/{id}` | customer-safe projection of a valid published canonical listing | Yes, through API |
| Publication audit | `moodoor_publication_events/{id}` | action, actor, timestamp, source revision, reason | No |
| Collections | `collections/{id}` | owner, season, design membership, narrative metadata | Public only when explicitly published |

## Lifecycle Architecture

```text
Inventory → Emotional brief → Formula selection → Deterministic blueprint
       → Quality / repair → Blueprint revision → Marketplace draft
       → Quality approval + availability → Maker release to Moodoor
       → Public projection → Moodoor discovery → Product detail → Commerce adapter
```

The quality threshold remains **0.78** for automatic Moodoor eligibility unless an authorized approval record is present. The current deterministic Moodoor ranker remains the behaviour specification, but it moves behind a server route during the production-hardening phase.

## Delivery Slices

### Slice 1 — Trustworthy Foundation

1. Canonical TypeScript contracts for user tier, inventory, blueprint, quality report, listing, public projection, and audit events.
2. Firestore rule redesign for user-owned private documents, server-only public projection writes, and no raw marketplace public reads.
3. Versioned Express API contracts for marketplace publication, Moodoor release, public matching, and public listing detail.
4. Server-side Firebase ID-token verification and ownership/entitlement checks.
5. Deterministic test suites for schema validation, gates, and matching.

### Slice 2 — Maker Operating Workflow

1. Replace placeholder Order Studio generation inputs with saved design briefs and actual inventory selection.
2. Persist blueprint revisions, quality scoring, repair status, and builder-export readiness.
3. Build marketplace draft/review/publish controls with structured public tags, media, price, and availability.
4. Create usage counters and tier enforcement for gated maker tools.

### Slice 3 — Moodoor Consumer Journey

1. Generate and revoke `moodoor_public_listings` as an atomic consequence of release changes.
2. Serve server-ranked matches from a controlled public API.
3. Replace mock marketplace browse/detail with a customer-safe listing detail page.
4. Connect Moodoor result cards to public detail routes rather than the authenticated maker marketplace shell.

### Slice 4 — Commerce and Lifecycle Operations

Commerce provider selection is intentionally deferred until the owner confirms whether checkout is required now. If physical or digital products will be sold directly, use a provider-backed product, cart, checkout, payment, and fulfilment layer rather than writing payment logic manually. If catalogue-first is chosen, Moodoor and Marketplace will route to enquiry, commission, or waitlist conversion until checkout is enabled.

### Slice 5 — Production Readiness

1. Migration/backfill scripts with idempotent checkpoints and remediation reports.
2. Feature flags and shadow matching to compare current matcher output with server output before cutover.
3. Firestore indexes, audit logging, rate limits, error reporting, and health checks.
4. Role-based admin review, security-rule regression tests, and launch checklist.

## Non-Negotiable Invariants

- A consumer never receives raw inventory quantities, supplier data, internal composition details, cost, margin, or raw score components.
- Marketplace publication does not itself make a listing Moodoor-visible; maker release, quality, and availability are all required.
- All client-visible permissions are duplicated by server-side authorization for sensitive writes and private reads.
- The composition flow preserves the existing deterministic order: emotion → inventory → formula → blueprint → quality/repair → builder/render output.
- Schema migrations are additive, versioned, idempotent, and reversible until each cutover is verified.

## Current Open Decision

The sole outstanding platform choice is commerce scope:

| Option | Result |
|---|---|
| Catalogue first | Build real browse, detail, Moodoor discovery, lead capture, and maker publication now; checkout follows later. |
| Direct commerce | Add a provider-backed products, cart, checkout, payments, and fulfilment integration after the core publication model is live. |

The foundational and maker/Moodoor work does not depend on this choice and can proceed immediately.
