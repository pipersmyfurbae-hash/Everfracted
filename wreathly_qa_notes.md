# Wreathly page QA notes

Previewed locally at http://127.0.0.1:8080/wreathly.html.

## Verified
- Hero renders with dark cinematic treatment, serif headline, green accent, split layout, and dashboard-style Wreathly app mockup.
- Sticky navigation is visible and includes Evercrafted, How it works, Apps, Design DNA, Pricing, Sign in, and Try Wreathly.
- Hero proof stats render: 2.4k makers designing, 18k wreaths imagined, 14d free trial.
- Marquee renders feature labels: Design DNA, Batch Generation, Inventory Intelligence, Client-ready Renders, Cost in Real Time, Builder Guides.
- Intro section renders with editorial copy, pull quote, four stat tiles, and Explore Design DNA link.
- Design DNA feature section renders dark editorial split layout with interactive DNA layer rows and wreath canvas mockup.
- Inventory intelligence feature section renders cost board with materials, quantities, total cost, retail suggestion, and build estimate.
- Page text extraction confirms subsequent sections for collection variants, batch generation, workflow, dashboard, testimonials, tier cards, CTA, and footer.
- The page is standalone HTML with inline CSS/JS, responsive breakpoints, scroll reveal, layer-row interaction, and batch button interaction.

## QA status
- No visible structural errors in the first two viewport checks.
- Continue review of the lower sections, then commit and push the page to the GitHub main branch.
- Source file: /home/ubuntu/evercrafted-repo/wreathly.html
2026-08-12

Sources: local browser preview and extracted page markdown from /home/ubuntu/page_texts/127.0.0.1_8080_wreathly.html.md.

The collection section rendered with four distinct editorial palette cards: Autumn welcome, Soft gathering, Quiet evergreen, and Market morning. The batch generation control was tested in-browser: it changed to “Generating…” while disabled, then resolved to “Batch ready · View 12” and re-enabled after the simulated generation delay.

The lower content is confirmed in extracted page text, including the five-step workflow, studio dashboard, testimonials, pricing tiers, CTA, and footer.

Sources: local browser preview, browser console interaction output, and extracted page markdown.
