# Order Studio Visual QA

## 2026-08-19 local review

The updated `/app/order-studio` route was built successfully and opened through the local Vite server. The route correctly redirected an unauthenticated session to `/login`, where the existing Evercrafted Studio sign-in surface rendered normally. Full interactive visual inspection of Order Studio itself requires a Firebase-authenticated Studio-tier maker session; this access control is expected because the route is protected by the application shell and tier guard.

The production build completed after the Order Studio replacement with no TypeScript or bundling errors.

## 2026-08-19 Moodoor catalogue review

The new public `/moodoor/catalogue` route rendered correctly in the local client with the editorial header, seasonal filters, and error-state handling. The first local data request correctly failed because the Express service was not running and the initial Vite session did not yet have the API proxy configuration. The service has since been made independently startable by lazily loading optional media modules, and the Vite proxy was added for `/api` during local development.

The local Express process cannot query the real Firestore data without an application-default Google Cloud project and credentials, so this environment returns the intentional public `CATALOGUE_UNAVAILABLE` error. The public API contract has been independently tested with a projection fixture, including proof that private inventory and supplier fields do not leave the API boundary.

The restarted public catalogue route was visually reviewed. Its editorial layout and seasonal filter controls render successfully, and it displays the safe public error message returned by the API in the credential-less local environment. The public `/moodoor/listing/:slug` route was also checked with an unavailable slug and correctly rendered a calm fallback with a single route back to the public catalogue. Both pages avoid mock product data, checkout controls, private inventory, suppliers, costs, and internal scores.
