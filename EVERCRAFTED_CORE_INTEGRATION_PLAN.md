# Evercrafted Core Integration Plan

## Objective
Make the Evercrafted Engine the single core runtime so every app uses one shared request path and shared service contract.

## What is already in this repo
- `backend/server.js` already exposes the core domain APIs for formulas, memory weaving, inventory intelligence, blueprints, orders, and integrations.
- Most `app-*.html` pages call the same engine endpoint pattern but duplicated inline.
- `engine-proxy.js` already provides a local proxy path to avoid CORS issues in local development.

## What was centralized now
- Added `assets/js/evercrafted-core-engine.js` as the shared frontend core client.
- Updated all `app-*.html` pages that use engine generation to call this shared core client.
- Removed one hard-coded direct engine debug call in `app-memory-weaver.html` so traffic always flows through the core resolver.

## Target architecture (recommended)
1. **Core API layer (source of truth):** `backend/server.js`
   - Keep all engine capabilities behind stable endpoints.
   - Version endpoint groups in-place (e.g. `/v1/memory-weaver`) before external launch.
2. **Gateway layer:** `engine-proxy.js` (local) and production API gateway.
   - Enforce auth, rate limits, logging, and request IDs.
3. **Frontend core SDK:** `assets/js/evercrafted-core-engine.js`
   - Own endpoint resolution, request formatting, retries, and error normalization.
4. **App UI layer:** `app-*.html`
   - No direct engine URLs.
   - No app-specific transport logic beyond calling SDK methods.

## Next integration steps
1. Expand `assets/js/evercrafted-core-engine.js` to support all major backend capabilities, not just `runEmotion`.
2. Move auth/session calls (`signup/signin/password-reset`) into the same shared SDK for one transport/auth policy.
3. Move waitlist/contact submission calls into the SDK for consistent telemetry and error handling.
4. Add one environment configuration file (local/staging/prod) consumed by both frontend SDK and proxy.
5. Add structured response envelopes from backend (`{ ok, data, error, requestId }`) for consistent UI handling.
6. Add health checks in app boot (`/health`) and render engine status badge in shell pages.

## Migration rule to keep
For every new app feature:
- Add/extend backend endpoint first.
- Add/extend shared SDK method second.
- Call SDK method from app page last.

This enforces "everything runs off the core engine" without future fragmentation.
