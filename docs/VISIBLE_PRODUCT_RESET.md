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
