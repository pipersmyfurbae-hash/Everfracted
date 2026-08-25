# Evercrafted & Moodoor: Launch-Ready E-Commerce Roadmap

**Purpose:** Convert the current permanent, interactive Evercrafted experience into a complete premium wreath storefront. The first release should keep the brand’s editorial restraint while making it easy for a visitor to discover a wreath, trust the studio, buy a ready-to-ship piece, or request a bespoke one.

> **Recommended commercial model:** Moodoor remains the discovery layer. Shopify owns the cart, payment, order confirmation, tax, and fulfilment flow. Evercrafted should never build its own payment form or store raw payment details.

## 1. What exists today

The live site already demonstrates two compelling product moments. Moodoor gives a visitor a feeling-led way to discover wreaths, while Maker Studio demonstrates how a creator can shape a composition from a brief. These are strong foundations, but they are still a product demonstration rather than a storefront: product imagery is illustrative, the catalogue is not backed by live merchant data, and the buy action does not yet open a production checkout.

The immediate goal is therefore not to add every imaginable feature. It is to turn the visitor’s path into a reliable sequence: **discover → understand → choose → purchase or enquire → receive confirmation and support**.

## 2. Pages to add

| Priority | Page | What it must do | Why it matters at launch |
|---|---|---|---|
| **P0** | **Shop / Current Edit** | A browsable, real catalogue with seasonal collection, availability, price, and simple filters such as mood, season, door tone, and ready-to-ship vs bespoke. | Lets visitors browse without completing the Moodoor quiz first. |
| **P0** | **Real product-detail page** | Large product imagery, close-up detail, dimensions, materials/care statement, what is included, door styling note, availability, shipping window, price, and a purchase or enquiry CTA. | This is the decision page. It must replace the current demo detail drawer. |
| **P0** | **Bespoke wreath enquiry** | Short guided brief: occasion, palette/mood, wreath size, door or setting, budget range, requested date, and contact details. Show what happens next. | Preserves the premium, personal path for limited or made-to-order pieces. |
| **P0** | **Shipping, returns, and care** | Clear dispatch windows, delivery regions, return rules, damage-support path, wreath care, and seasonal storage guidance. | Removes the uncertainty that stops customers from purchasing decor online. |
| **P0** | **Contact / concierge** | Email, enquiry form, response expectation, and a concise studio-hours note. | Provides a human fallback at every stage of a higher-consideration purchase. |
| **P0** | **Policy pages** | Privacy, terms, shipping/returns, and cookie notice where required. | Required trust and operational basics before taking payment. |
| **P1** | **About the studio** | Founder/studio story, design philosophy, construction standards, and what “emotion-led” means without technical jargon. | Establishes credibility and gives the brand an origin story. |
| **P1** | **Moodoor result page** | A shareable, URL-based result rather than only in-page cards. It should show “your edit,” three recommendations, and a restart action. | Makes the discovery experience shareable and measurable. |
| **P1** | **Occasions and seasonal edits** | Evergreen entry points such as Autumn Doors, Winter Welcome, Housewarming, Sympathy, and Host Gifts. | Creates landing pages for campaigns, search, email, and social without making the catalogue feel crowded. |
| **P1** | **FAQ** | Sizing, hanging, materials, colour variation, delivery, gifting, care, and custom orders. | Reduces pre-purchase service volume and makes the shop feel established. |
| **P2** | **Journal / Door Notes** | Seasonal styling stories, behind-the-scenes craft, installation notes, and collection launches. | Builds organic discovery and reinforces the editorial brand over time. |
| **P2** | **Trade / designer enquiries** | A separate form for stylists, hospitality, and interior designers. | Supports higher-value business orders without complicating consumer checkout. |

## 3. Capabilities to add

### P0 — Required before accepting live orders

| Capability | Launch decision | Practical implementation |
|---|---|---|
| **Managed checkout** | Turn the “Purchase” CTA into a real hosted checkout only for explicitly ready-to-ship items. | Activate the existing Shopify Storefront connection and use the existing server-side checkout handoff. Shopify creates the cart and hosted checkout. |
| **Product and variant mapping** | Every direct-purchase listing needs an approved Shopify product and variant. | Keep the private Shopify variant reference server-side; expose only title, price, availability, and purchase capability to visitors. |
| **Availability control** | Prevent an unavailable one-of-one wreath from being purchased. | Maker chooses one of: available now, limited, made-to-order/enquiry, or unavailable. The product page and checkout CTA follow that state. |
| **Order confirmation and service email** | Customers need a clear receipt and next step. | Use Shopify transactional confirmation; add a branded service message for bespoke enquiries. |
| **Fulfilment setup** | State accurate dispatch lead times and delivery regions. | Configure shipping profiles, rates, order handling, and tax in Shopify before the first public purchase. |
| **Real product photography** | Replace illustrative wreath art on product cards with at least one full hero image and two supporting images per sellable item. | Use a consistent product photography brief: front-on door/lifestyle image, neutral product shot, and close-up construction/texture view. |
| **Conversion analytics** | Know where visitors abandon the discovery-to-purchase path. | Track Moodoor starts, choices, results, product views, enquiry submissions, checkout starts, and completed orders with consent-aware analytics. |
| **Search and social metadata** | Each collection and product must be shareable. | Add page titles, descriptions, Open Graph images, canonical URLs, sitemap, and product structured data. |
| **Accessibility and mobile QA** | Every core shopping action must work by keyboard and on a phone. | Test focus state, form labels, contrast, image alt text, tap targets, and checkout handoff across key mobile breakpoints. |

### P1 — High-value enhancements after the first orders

| Capability | Customer value | Suggested approach |
|---|---|---|
| **Email capture and welcome flow** | Lets a visitor save an edit and return for a collection launch. | Offer “Receive the next edit” after Moodoor results, with a clear consent statement. |
| **Gift messages and delivery-date preferences** | Makes wreaths viable for gifting and hosting moments. | Use Shopify line-item attributes or a light request flow during checkout. |
| **Waitlist / restock notification** | Converts interest in sold or limited items into demand signals. | Let visitors join the waitlist from unavailable listings and notify from the collection system. |
| **Saved Moodoor edit** | Gives visitors a reason to return without creating account friction. | Use a shareable result URL first; add accounts only when repeat purchase behaviour justifies them. |
| **Reviews and customer photos** | Adds proof once orders are shipping. | Introduce only after a process exists to request, moderate, and display high-quality customer content. |
| **Maker release queue** | Makes publishing operationally clear for the studio. | A dashboard queue for draft, quality-approved, photographed, Shopify-linked, Moodoor-released, and sold-out statuses. |

### P2 — Growth and operational scale

| Capability | Why it comes later |
|---|---|
| **Customer accounts** | Useful for repeat customers and order history, but not required for an excellent first purchase. Shopify checkout can cover the initial order experience. |
| **Subscription or seasonal club** | A strong future offer once cadence, inventory, pricing, and fulfilment are proven. |
| **Referral and loyalty programme** | Best introduced after a real customer base and post-purchase journey exist. |
| **Automated recommendations from purchase history** | Requires reliable consent, order data, and enough catalogue volume to produce relevant suggestions. |
| **Trade pricing portal** | Add after the wholesale or design-trade offer and operational terms are explicitly defined. |

## 4. Recommended site map

```text
/
├── /moodoor                         Feeling-led discovery entry point
├── /shop                            Full current edit / catalogue
│   ├── /collections/:collection     Seasonal and occasion-based collections
│   └── /wreaths/:slug               Real product-detail page
├── /custom                          Bespoke wreath enquiry
├── /about                           Studio story and design standards
├── /faq                             Pre-purchase answers
├── /shipping-returns                Delivery, returns, care, and support
├── /contact                         Concierge contact
├── /journal                         Editorial and seasonal content
└── /app                             Maker workspace, authenticated and separate from consumer shopping
```

The consumer shop should never expose the maker’s raw inventory, private quality scores, supplier details, or internal workflow. Maker Studio remains a separate authenticated workspace.

## 5. A practical launch sequence

| Release | Scope | Definition of done |
|---|---|---|
| **Release 1 — Sell one collection** | Real catalogue, product pages, Shopify checkout for ready-to-ship items, bespoke enquiry, shipping/returns/contact/policy pages, product photography, analytics, and mobile QA. | A visitor can purchase one eligible wreath, receive confirmation, and get it fulfilled without manual technical work. |
| **Release 2 — Build confidence** | About page, FAQ, shareable Moodoor results, occasion landing pages, newsletter capture, waitlist, and maker release queue. | The store supports campaigns, repeat visits, and an orderly release process. |
| **Release 3 — Build repeat demand** | Journal, reviews, gift preferences, selected customer accounts, seasonal club evaluation, and trade enquiry. | Customer acquisition and repeat-purchase loops are measurable and sustainable. |

## 6. The next five build decisions

1. **Choose the first sellable collection.** Start with a deliberately small collection of three to six wreaths rather than a broad catalogue.
2. **Connect Shopify and configure a test product.** Activate the server-only Storefront credentials, create one non-production product and variant, then complete a safe checkout test before enabling any live listing.
3. **Build the real catalogue and product-detail page.** This is the most important visible work after the current demo.
4. **Build the bespoke enquiry route and the shipping/returns/contact pages.** This protects conversion when a visitor is not ready for direct checkout or wants something personal.
5. **Photograph the first collection and define availability states.** The store should only claim “available now” when the corresponding physical piece and fulfilment path are ready.

## 7. What not to build yet

Avoid a generic multi-vendor marketplace, custom payment processing, a full customer-account system, elaborate loyalty mechanics, or an enormous inventory catalogue. They will make the experience feel less curated and consume time before the first collection has proven its commercial rhythm.

## Reference

The existing direct-checkout boundary is designed to create a Shopify Storefront cart server-side and return the hosted checkout link. See [Shopify’s Storefront cart guide](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage).
