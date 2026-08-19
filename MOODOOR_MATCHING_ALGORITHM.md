# Moodoor Matching Algorithm and Scoring Formula

## Purpose

`services/moodoorMatching.ts` implements a **deterministic, explainable, tag-driven matcher**. It does not use an embedding model, an LLM, or probabilistic ranking at match time. It first enforces publication, availability, and quality rules; it then calculates a bounded score from mood, season, door-context, and availability signals.[1]

> A listing may be eligible for a maker to inspect in Moodoor Studio without being eligible for a consumer to see. Consumer visibility requires an explicit Moodoor release in addition to marketplace publication and quality/availability eligibility.[1]

## 1. Input Model

The customer finder supplies one value from each of the following controlled vocabularies.

| Input | Accepted values | Function in matching |
|---|---|---|
| `mood` | `calm`, `warm`, `dramatic`, `romantic`, `natural`, `festive` | Primary emotional signal. |
| `season` | `spring`, `summer`, `autumn`, `winter`, `occasion` | Contextual fit signal. |
| `door` | `dark-wood`, `painted-light`, `modern`, `rustic`, `neutral` | Palette and style compatibility signal. |

A candidate is represented by public-safe fields: title, summary, season tags, mood tags, palette tags, formula, availability, quality state, price, and approved image URL. The matching text corpus concatenates title, summary, formula, season tags, mood tags, and palette tags after normalization.[1]

## 2. Normalization and Signal Detection

Every candidate string is transformed by trimming, lowercasing, and replacing underscores and hyphens with spaces. A signal matches if the normalized concatenated listing text includes **any** normalized synonym from the selected signal family.[1]

| Selected input | Token family searched |
|---|---|
| Calm | `calm`, `quiet`, `still`, `minimal`, `soft`, `serene`, `mist`, `ivory` |
| Warm | `warm`, `welcoming`, `golden`, `amber`, `hearth`, `cozy`, `rich` |
| Dramatic | `dramatic`, `bold`, `contrast`, `deep`, `sculptural`, `editorial` |
| Romantic | `romantic`, `soft`, `tender`, `blush`, `garden`, `velvet`, `rose` |
| Natural | `natural`, `organic`, `botanical`, `garden`, `wild`, `fresh`, `green` |
| Festive | `festive`, `holiday`, `evergreen`, `berry`, `celebration`, `winter` |

The door-context token families are:

| Door type | Compatibility tokens |
|---|---|
| Dark wood | `warm`, `golden`, `ivory`, `contrast`, `evergreen` |
| Painted light | `natural`, `green`, `blue`, `soft`, `contrast` |
| Modern | `minimal`, `sculptural`, `quiet`, `contrast`, `architectural` |
| Rustic | `natural`, `warm`, `garden`, `organic`, `harvest` |
| Neutral | `balanced`, `natural`, `soft`, `warm`, `calm` |

A category is **binary**: regardless of how many terms from a family occur, the category contributes its weight once only.[1]

## 3. Hard Eligibility Gates

The algorithm does not score every record. It excludes candidates before ranking under the following rules.

| Gate | Exact rule | Effect |
|---|---|---|
| Marketplace state | `status` must normalize to `published`. | Unpublished records are not candidates. |
| Consumer release | `moodoorPublished === true` **or** `moodoorStatus === 'published'`. | Marketplace publication alone is insufficient for consumer visibility. |
| Availability | Strings containing `out`, `out of stock`, `sold out`, `unavailable`, or `discontinued` normalize to `unavailable`. | Unavailable records are excluded. |
| Quality | `qualityApproved === true`, a score report status of `pass`, or a numeric `qualityScore`, `score`, or `scoreReport.total` of at least `0.78`. | Below-threshold or unapproved records are excluded. |

Availability strings containing `low`, `limited`, or `few remaining` are normalized to `limited`; all other values default to `in_stock` if no unavailable condition is found.[1]

## 4. Scoring Formula

For each surviving candidate, Moodoor starts with a baseline score and adds each satisfied signal family once.

\[
\text{score} = \min\left(1.00,\ 0.22 + 0.34M + 0.22S + 0.16D + A\right)
\]

| Component | Condition | Increment |
|---|---|---:|
| Baseline | Candidate passed scoring-stage availability and quality checks. | `+0.22` |
| `M` | Any selected-mood token occurs in the public listing corpus. | `+0.34` |
| `S` | Selected season occurs in season tags **or** the public listing corpus. | `+0.22` |
| `D` | Any selected door-context token occurs in the public listing corpus. | `+0.16` |
| `A` | Listing is `in_stock`. | `+0.06` |
| `A` | Listing is `limited`. | `+0.03` |

The maximum score is exactly **1.00** for an in-stock listing that matches mood, season, and door context:

\[
0.22 + 0.34 + 0.22 + 0.16 + 0.06 = 1.00
\]

A candidate must score at least **0.42** to survive. This means a baseline candidate needs at least one additional positive signal; no listing can appear solely because it was available and quality-approved.[1]

## 5. Worked Example

Assume the customer selects **Warm**, **Winter**, and **Dark wood**, and an in-stock candidate has “Winter Hearth” as a title, with `warm`, `hearth`, `evergreen`, and `golden` in its public metadata.

| Stage | Why it qualifies | Increment | Running score |
|---|---|---:|---:|
| Eligibility | Published, explicitly released, available, and quality-approved. | — | Eligible |
| Baseline | Candidate reaches the ranking stage. | `+0.22` | `0.22` |
| Mood | `warm` or `hearth` satisfies the Warm family. | `+0.34` | `0.56` |
| Season | `winter` occurs in season tags or public text. | `+0.22` | `0.78` |
| Door | `warm`, `golden`, or `evergreen` satisfies Dark wood compatibility. | `+0.16` | `0.94` |
| Availability | Record is `in_stock`. | `+0.06` | **`1.00`** |

The customer explanation uses up to the first three recorded signals, producing language such as: “Winter Hearth was selected for its warm mood, winter fit, dark wood compatibility.”[1]

## 6. Ranking, Diversity, and Output Rules

The matcher sorts surviving candidates by descending numerical score. Exact ties are broken alphabetically by title. It then removes duplicate formulae: the identity is the normalized `formula` value, or the normalized title if formula is missing. The remaining results are truncated to a maximum of **three**.[1]

This final diversity pass prevents an otherwise dominant formula from occupying every slot in the curated edit. It does not change a candidate’s score; it only constrains the set of returned results.

## 7. Important Behavioural Implications

The current algorithm deliberately favors **interpretability over semantic nuance**. A signal is a substring match, so the quality of public tags and copy directly determines match quality. It also means token overlap can legitimately serve more than one category. For example, `warm` can satisfy both a Warm mood selection and Dark wood compatibility, because those are intentionally distinct signal families.[1]

The production-hardening plan should move the public projection and matching call to a secure server-side or callable function, require a public metadata contract at marketplace publication, and add more structured semantic fields if richer matching is desired. Those changes would improve privacy enforcement and relevance without changing the current algorithm’s explicit scoring rules.[2]

## References

[1] [`services/moodoorMatching.ts`](services/moodoorMatching.ts), implemented matcher, eligibility gates, token vocabularies, and ranker.

[2] [`docs/MOODOOR_STUDIO_MERGE.md`](docs/MOODOOR_STUDIO_MERGE.md), integration boundary, validation record, and production-hardening roadmap.
