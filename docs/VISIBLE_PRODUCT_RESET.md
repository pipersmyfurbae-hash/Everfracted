# Visible Product Reset

## Initial local review

The existing public homepage did not render in the local Vite review session even though the client loaded without a browser-console exception. This makes the current repository unsuitable as an immediately reviewable product experience and confirms the user’s concern: the visible journey is not yet reliably accessible.

## Product reset decision

The next visible delivery will be a standalone, public Evercrafted product demo that does not depend on Firebase authentication, live Firestore data, or external provider configuration. It will show the actual customer and maker journeys in one navigable interface:

1. A customer selects a feeling, season, and door, then sees curated wreath matches.
2. A customer views a product detail with enquiry or secure-checkout capability states.
3. A maker opens a studio dashboard, creates a design brief, sees a blueprint preview, and advances it toward a public listing.

This demo will be connected to the existing application through a public route once it is built, so the user can open and evaluate a real interface rather than inspect infrastructure documents.

## Visible review evidence

The public `/experience` route now renders a complete customer-facing Moodoor journey with a readable editorial hero, interactive feeling/season/door choices, dynamic product recommendations, product capability states, and a clear purchase or enquiry action. The same page successfully switches to an authentication-free Maker Studio workspace, where the visitor can enter a design brief, select a composition formula, generate a visual blueprint, and publish the preview to the demo Moodoor collection.

## Exposed-link review

The first external review attempt was blocked by Vite host protection. The review-server configuration has been updated to permit temporary proxied hosts and the server restarted. The exposed route then reached the application shell, but the remote browser preview showed a blank rendering state despite the route working in the local browser review. The next visual verification step should therefore use the externally exposed page’s runtime state rather than rely on the earlier blocked-host response.

## Production preview verification

The production-mode preview at `/experience` was exposed successfully and rendered the full visible product demo through the temporary review URL. The customer journey, option controls, product cards, and maker-studio navigation were available in the external review page. This path is the correct review surface; the development-server proxy remains useful for implementation but is not the delivery link.

## Permanent hosting activation

The GitHub Pages settings page is open at `https://github.com/pipersmyfurbae-hash/Everfracted/settings/pages`. Pages is presently disabled. The committed workflow `deploy-pages.yml` is ready, and the owner confirmed activation. The visible source selector offers **GitHub Actions**, which is the required option for the committed Vite build-and-deploy workflow.

The initial GitHub Actions deployment failed because `configure-pages` could not find a Pages site immediately after the source change. The workflow now uses `enablement: true`, which allows the first deployment to create or enable the Pages site instead of depending on the repository setting to propagate first. Commit `e6c0682` triggered the corrected deployment run `32870782162`.

The corrected Pages deployment is active in GitHub Actions and has produced the upload artifact; at the latest review it was executing the final `Deploying to github-pages` stage. The permanent URL must be checked once that stage reports completion.

The GitHub Pages hostname is now serving the application document at the permanent `/Everfracted/experience` address, confirming that Pages activation and deployment succeeded. The external browser preview initially displayed a blank app shell without a runtime console exception, so the next correction will focus on static-SPA route handling and deployment artifact behavior rather than hosting enablement.

The final GitHub Pages deployment completed successfully at 16:18 for commit `4c49f88`. GitHub Actions reports the permanent site URL as `https://pipersmyfurbae-hash.github.io/Everfracted/`.

## Production visual review

The permanent production URL was reviewed in-browser. Moodoor renders as a dark botanical editorial discovery experience with a strong hero, simple three-part preference selector, curated product cards, and a clear purchase or enquiry state. The Maker Studio renders as a light, structured workspace with a dark side rail, visible brief input, formula choices, a polar wreath preview, stem and size indicators, and a deliberate create/publish progression. Both views load and switch successfully at the permanent URL.

The local Vite preview did not include the deployment workflow’s `404.html` fallback, so a direct deep-link request to the new collection route showed the static-host shell rather than a rendered route. This does not represent the GitHub Pages artifact, where the workflow copies `index.html` to `404.html`; collection QA will continue through a normal client-side route entry and the production workflow will be rechecked after publish.

The Vite preview server does not emulate GitHub Pages’ repository subpath, so it cannot load build assets from `/Everfracted/` during local deep-link testing even when `404.html` is present. The source will be visually checked through Vite’s normal development route, then rechecked at the real Pages hostname after the automated deployment runs.

The new catalogue renders as intended through the normal application route: an editorial dark-green collection hero, product stories, pricing, and three clear product entries. The production-only `/Everfracted` image path means collection photos do not load in the local root-hosted development route; the asset helper will be made base-aware so the same source renders locally and at the permanent GitHub Pages URL.

Immediately after the first collection release was pushed, the permanent catalogue URL still showed the prior API-backed catalogue and its expected static-host request error. This indicates the GitHub Pages deployment or CDN had not yet propagated; the workflow status and live URL will be rechecked before handoff.

The GitHub Pages deployment for the first Moodoor collection completed successfully in 48 seconds at commit `3b16f8c`. The deployed artifact includes the original collection photography; the public catalogue URL will be reloaded after propagation to confirm the new editorial collection has replaced the prior API-backed view.

The permanent production catalogue now renders the First Threshold Edit with all three original product images, live links, collection story, pricing, and availability labels. The lead product detail route for Quiet Winter Welcome also renders correctly with the product image, material and care sections, related pieces, and a prefilled customer enquiry action.
