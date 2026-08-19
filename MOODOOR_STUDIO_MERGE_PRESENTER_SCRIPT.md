# Moodoor Studio × Everfracted — Presenter Script

## Slide 1 — Cover: Moodoor Studio × Everfracted

“Today’s story is about one controlled merger: bringing Moodoor’s consumer-facing discovery experience into Everfracted without splitting the platform or duplicating the catalogue. The outcome is a shared-data, separate-experience model. Evercrafted remains the place where makers design, assess, and publish. Moodoor becomes the curated, customer-safe experience that helps someone choose a wreath with confidence.”

## Slide 2 — One source of truth. Two purposeful experiences.

“The strategic decision is simple: we do not want two systems trying to own the same product data. Evercrafted remains the maker-facing source of truth for design, inventory, marketplace publishing, and quality review. Moodoor has a different job. It turns approved and available designs into a small, emotionally legible customer edit. This is not a separate commerce engine. It is a carefully constrained projection of Evercrafted’s work.”

## Slide 3 — Adapt the durable logic — not the duplicate runtime.

“The archive contained meaningful product intelligence, but it also contained its own runtime, router, and browser-local repositories. Copying it wholesale would create two application shells and two data models. Instead, we adapted the parts that age well: explicit public publishing, a consumer finder, and deterministic matching. We intentionally excluded the separate Wouter shell and local repositories. Richer collection, campaign, launch, and lookbook modules remain good candidates for a later integration, once they can attach to authoritative Evercrafted schemas.”

## Slide 4 — The merger adds two routes, not a second platform.

“The implementation adds two deliberate experiences. The existing public Moodoor landing page now directs visitors to `/moodoor/find`, where they select a feeling, season, and door context. On the maker side, `/app/moodoor-studio` is protected by the Studio entitlement and lets the owner release or remove eligible designs. The important detail is that both experiences use Everfracted’s existing React Router, Firebase, authentication, and tier guard. We added journeys; we did not add a competing platform.”

## Slide 5 — Publication is an explicit quality gate.

“Public visibility is not a side effect of marketplace publication. A listing moves through four gates: it must be marketplace-published, quality-approved, deliberately released by the maker to Moodoor, and then it can become consumer-visible. The current numerical gate is 0.78 unless the record has explicit approval. A maker can see an eligible design before it is released, but a customer cannot. That distinction is the backbone of the public/private separation.”

## Slide 6 — The public projection stays intentionally small.

“Moodoor only needs enough information to make a thoughtful recommendation. It can use a public title, summary, approved image, price, availability label, and structured mood, season, palette, and formula tags. It never needs raw inventory counts, supplier data, margins, placement coordinates, collision logic, or internal score components. This is a product decision and a security decision. Customer relevance should not require us to expose how the maker operates.”

## Slide 7 — Matching is deterministic, explainable, and binary by signal family.

“Before we score anything, the system rejects listings that are not explicitly released, are unavailable, or have not cleared quality. Ranking begins at 0.22, then adds a fixed contribution for mood, season, door compatibility, and availability. The maximum is one point zero. Each signal family is binary: seeing multiple warm words does not multiply the mood weight. This makes the result repeatable, auditable, and easy to explain when a maker asks why a particular design surfaced.”

## Slide 8 — A warm winter wreath on dark wood scores 1.00.

“This example traces the most aligned case. The candidate starts with the eligibility baseline of 0.22. A warm or hearth signal adds 0.34. A winter signal adds 0.22. Dark-wood compatibility adds 0.16. In-stock availability adds 0.06. That totals exactly one point zero. The output set is then sorted by score, ties are broken by title, duplicate formulas are removed, and the customer sees no more than three distinct recommendations.”

## Slide 9 — The customer receives a clear reason — not a black box.

“The matcher works against normalized public text: title, summary, formula, season tags, mood tags, and palette tags. It records which signal families contributed and turns up to three of them into a short explanation. The customer might see ‘warm mood, winter fit, dark wood compatibility.’ Just as important, the system is willing to say no. If nothing reaches 0.42, Moodoor shows a no-match state rather than forcing an irrelevant suggestion. That restraint protects trust in the edit.”

## Slide 10 — Implementation connects product, operations, and reliability.

“Three implementation layers matter here. `pages/Moodoor.tsx` owns the public finder and the maker publishing surface. `services/moodoorMatching.ts` owns the projection, gates, vocabulary, ranker, and release toggle. The Firestore marketplace remains the current shared source. We also isolated optional AI initialization behind a lazy client so an unconfigured browser key cannot prevent Moodoor—or the app shell—from rendering. Several pre-existing source-path and Firebase import issues were corrected so the integration builds reliably.”

## Slide 11 — The merge is validated; the launch boundary is explicit.

“The archive was catalogued without executing its source. The matching fixtures pass. The Vite production build passes. And browser validation confirmed finder rendering, mood selection, and progression to the season step. The next work is not cosmetic; it is production hardening. We need a dedicated public projection, server-side matching or a callable function, strict publication metadata requirements, and public detail and story experiences. This is the point where a strong MVP becomes a secure commerce platform.”

## Slide 12 — Moodoor makes selection feel considered.

“The closing idea is the product promise. Moodoor makes selection feel considered because the complex craft remains private, while the customer sees a clear, relevant, and explainable edit. Evercrafted continues to own the craft system. Moodoor turns the approved outcome into public clarity. That is the value of the merger.”

## References

[1] [`services/moodoorMatching.ts`](services/moodoorMatching.ts), matching, publication gate, and ranking implementation.

[2] [`MOODOOR_CODE_WALKTHROUGH_AND_MIGRATION_PLAN.md`](MOODOOR_CODE_WALKTHROUGH_AND_MIGRATION_PLAN.md), code walkthrough and migration architecture.

[3] [`slides/moodoor-studio-merge-outline.md`](slides/moodoor-studio-merge-outline.md), deck narrative and slide order.
