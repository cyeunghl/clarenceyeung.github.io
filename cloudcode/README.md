# Cloud Code Strava integration mock

This directory sketches a deployable Strava integration that pairs with the static
portfolio. The implementation targets a Cloudflare Workers style runtime so the
frontend can securely authenticate with Strava, refresh tokens, and expose an
edge API at `/api/strava/activities` that the globe module consumes.

## Components

- **`strava-activities.js`** – Worker entrypoint. Handles three routes:
  - `GET /auth/strava` – starts the OAuth flow by redirecting to Strava and
    setting a signed session cookie.
  - `GET /auth/strava/callback` – finishes OAuth, exchanges the code for tokens,
    and persists them in a KV namespace.
  - `GET /api/strava/activities` – returns clustered activity JSON for the
    Three.js globe, refreshing tokens when needed.
- **`STRAVA_SESSIONS` KV namespace** – stores session metadata and short-lived
  OAuth state. Replace with D1/Workers KV/Supabase if desired.
- **Secure cookies** – `clarence_strava_session` ties the client to a stored
  token bundle without exposing credentials to the browser.

## Environment variables

Configure the Worker with the following bindings (e.g. via `wrangler.toml`):

```toml
name = "clarence-strava"
main = "cloudcode/strava-activities.js"
compatibility_date = "2024-04-05"

[vars]
STRAVA_CLIENT_ID = "your-client-id"
STRAVA_CLIENT_SECRET = "your-client-secret"
STRAVA_REDIRECT_URI = "https://clarenceyeung.github.io/auth/strava/callback"

[[kv_namespaces]]
binding = "STRAVA_SESSIONS"
id = "kv-namespace-id"
```

The redirect URI must be registered inside your Strava developer settings. When
deploying to production, point it to the Worker domain (e.g.
`https://clarence-strava.workers.dev/auth/strava/callback`) and update the
frontend link accordingly.

## Local development

1. Install the Cloudflare CLI: `npm install -g wrangler`.
2. Log in: `wrangler login`.
3. Create a KV namespace: `wrangler kv:namespace create STRAVA_SESSIONS` and add
   the generated ID to `wrangler.toml`.
4. Run the worker locally:
   ```bash
   wrangler dev cloudcode/strava-activities.js --local
   ```
5. Update `main.js` to target `http://127.0.0.1:8787/api/strava/activities`
   during development if you are not proxying through GitHub Pages.

## Frontend hooks

- The hero scroll indicator still jumps to `#about`.
- The globe loader now attempts to hit `/api/strava/activities` before falling
  back to `assets/mock-strava.json`. This allows the static build to function
  without credentials, but seamlessly upgrade when the Worker is deployed.
- Add a login button or automatic redirect when you want to initiate the Strava
  OAuth flow (e.g. `https://clarenceyeung.github.io/auth/strava`).

## Next steps

- Persist additional athlete metadata (profile photo, totals) and expose it via
  the Worker for future hero/analytics widgets.
- Add activity webhooks by wiring another Worker route to Strava push updates.
- Implement CSRF protection for the OAuth state cookie (e.g. double submit
  tokens) if you expand beyond this private portfolio setup.
