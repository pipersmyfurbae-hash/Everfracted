## Cover

# Moodoor Studio × Everfracted

**A shared-data, separate-experience merger**

## Slide 1

# One source of truth. Two purposeful experiences.

- **Evercrafted** remains the maker-facing system for design, inventory, marketplace publishing, and quality review.
- **Moodoor** becomes the customer-facing editorial finder: a gentle three-step route to the right available wreath.
- The merger brings Moodoor’s public-publishing and explainable-matching principles into Everfracted rather than operating a parallel app.

**Visual direction:** Split canvas: maker system at left and customer finder at right, joined by a single curated data line.

## Slide 2

# Adapt the durable logic — not the duplicate runtime.

- The archive contained a full React/Vite/Express workspace with a Wouter router and browser-local repositories.
- **Adapted:** public customer flow, explicit publishing boundary, deterministic matching.
- **Not copied wholesale:** standalone shell, local state repositories, unreviewed third-party dependencies.
- **Deferred:** collection, campaign, launch, and lookbook modules until authoritative Everfracted schemas are ready.

**Visual direction:** Three-column decision matrix: adopted / excluded / deferred.

## Slide 3

# The merger adds two routes, not a second platform.

- **`/moodoor`** remains the public editorial landing page; calls to action now lead into the finder.
- **`/moodoor/find`** is a public three-step flow: Feeling → Season → Door → Curated edit.
- **`/app/moodoor-studio`** is a Studio-tier maker workspace to release or remove eligible marketplace designs.
- Everfracted’s existing React Router, Firebase, authentication, and tier guard remain the foundation.

**Visual direction:** Horizontal route map with a public lane and a Studio-protected maker lane.

## Slide 4

# Publication is an explicit quality gate.

**Lifecycle**

`Marketplace published → Quality approved → Maker releases to Moodoor → Consumer visible`

- A consumer listing must have marketplace status **published**.
- It must be explicitly released: **`moodoorPublished = true`** or **`moodoorStatus = 'published'`**.
- It must be available and either explicitly approved or meet the **0.78** quality threshold.
- A maker may see eligible candidates in Studio before releasing them; consumers cannot.

**Visual direction:** Four-stage gate with the 0.78 quality threshold emphasized as a gold checkpoint.

## Slide 5

# The public projection stays intentionally small.

| Moodoor can use | Moodoor never receives |
|---|---|
| Title, summary, approved image, price | Internal notes, supplier data, costs and margins |
| Availability label | Raw inventory quantities |
| Public mood, season, palette and formula tags | Placement coordinates, collision data, production detail |
| Short match explanation | Internal score components and confidence values |

**Takeaway:** Customer-facing matching is useful without exposing maker operations.

**Visual direction:** Privacy boundary diagram with a green public panel and a dark protected panel.

## Slide 6

# Matching is deterministic, explainable, and binary by signal family.

**Hard eligibility — evaluated before scoring**

- Consumer catalog query begins with `status = published`.
- Reject unless Moodoor release is explicit.
- Reject unavailable, sold-out, discontinued, or below-quality records.

**Scoring formula — each signal is a one-time binary increment**

`score = 0.22 + 0.34·M + 0.22·S + 0.16·D + A`

| Symbol | Condition | Weight |
|---|---|---:|
| `M` | Any selected-mood token appears in public listing text | 0.34 |
| `S` | Selected season appears in season tags or public listing text | 0.22 |
| `D` | Any door-context token appears in public listing text | 0.16 |
| `A` | In stock / limited availability | +0.06 / +0.03 |

- Start score: **0.22**; retain only matches at **≥ 0.42**; cap at **1.00**.

**Visual direction:** Formula at left; horizontal stacked score bar at right showing the maximum 1.00 composition.

## Slide 7

# A warm winter wreath on dark wood scores 1.00.

**Worked example**

| Step | Evidence | Score change | Running score |
|---|---|---:|---:|
| Baseline | Eligible candidate | +0.22 | 0.22 |
| Mood | “warm” / “hearth” appears in title, summary, tags, palette, or formula | +0.34 | 0.56 |
| Season | “winter” appears in season tags or public listing text | +0.22 | 0.78 |
| Door | “warm”, “golden”, “ivory”, “contrast”, or “evergreen” appears | +0.16 | 0.94 |
| Availability | In stock | +0.06 | **1.00** |

- Examples are ranked by score descending; title breaks exact-score ties.
- Formula duplicates are removed; title is the fallback identity when no formula exists.
- Moodoor returns no more than **three** distinct results.

**Visual direction:** A five-stage score rail building to 1.00, with a small “top 3 distinct formulae” output tray.

## Slide 8

# The customer receives a clear reason — not a black box.

- The matcher searches normalized text across **title, summary, formula, season tags, mood tags, and palette tags**.
- A category match is binary: multiple matching words do not multiply the same category weight.
- The explanation surfaces up to the first three positive signals: for example, “warm mood, winter fit, dark wood compatibility.”
- If no result clears **0.42**, Moodoor intentionally shows a no-match state rather than force a weak recommendation.

**Visual direction:** Searchable public fields flowing into a short customer-safe explanation card.

## Slide 9

# Implementation connects product, operations, and reliability.

- **`pages/Moodoor.tsx`** provides the public finder and maker publishing Studio.
- **`services/moodoorMatching.ts`** provides the public projection, eligibility gates, ranker, vocabulary, and publication toggle.
- **`services/geminiClient.ts`** makes optional AI initialization lazy so missing browser keys cannot block Moodoor.
- Existing source-path, Firebase import, and app alias defects were corrected so the front end builds.

**Visual direction:** Layered implementation stack: Route/UI → Matching service → Firestore marketplace → optional AI services isolated at the edge.

## Slide 10

# The merge is validated; the launch boundary is explicit.

**Completed validation**

- Archive catalogued without executing archive code.
- Deterministic matcher fixtures passed.
- Vite production build passed.
- Browser verification confirmed finder rendering, mood selection, and progression to Season.

**Next production hardening**

- Serve a dedicated public Moodoor projection through Firestore rules or a server-side/callable function.
- Require public mood, season, palette, availability, and quality-approval fields at marketplace publication.
- Add public detail pages, approved story drops, publishing history, and route-level code splitting.

**Visual direction:** Left column of four validation checks; right column roadmap arrows from secure projection to commerce-ready experiences.

## Slide 11

# Moodoor makes selection feel considered.

**Private craft. Public clarity.**

**Moodoor Studio × Everfracted**
