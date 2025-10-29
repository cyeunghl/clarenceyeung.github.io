# Strava Integration Architecture

This folder sketches the server-side services required to power the live Strava globe while keeping OAuth credentials off the static site. The layout mirrors a Cloud Run / Cloud Functions style deployment (similar to the mockups shown on the Cloud Code site) so you can drop the proxy straight into Google Cloud, AWS Lambda, or any other serverless platform.

## Overview

```
+----------------------+         +-----------------------+         +-----------------------+
|  Clarence Portfolio  |  HTTPS  |  Strava Proxy API     |  HTTPS  |    Strava Platform    |
|  (GitHub Pages)      +-------->+  (Cloud Run / CF)     +-------->+  OAuth + Activities   |
|                      |         |  /oauth/*, /activities|         |                       |
+----------+-----------+         +----------+------------+         +-----------+-----------+
           ^                               |                                      |
           |                               | Pub/Sub / Scheduler                   |
           |                               v                                      |
           |                   +--------------------------+                       |
           |                   | Token + Activity Cache   |<----------------------+ 
           |                   | (Secret Manager / DB)    |
           +-------------------+--------------------------+
```

1. **Browser** hits `/oauth/start` to begin the Strava login. The proxy redirects to Strava with client credentials.
2. After the user authorises, Strava calls `/oauth/callback`. The proxy exchanges the code for tokens, stores them securely, and sets a signed HTTP-only cookie so subsequent activity requests can be associated with the right profile.
3. `/activities` reads fresh data from Strava (refreshing the access token when necessary), clusters/filters it, caches the payload, and returns the simplified JSON expected by `globe.js`.
4. A scheduled job (Cloud Scheduler, GitHub Action, or cron) can ping `/tasks/refresh` to pre-warm the cache every few hours so the page loads instantly.

## Repository Layout

- `strava-proxy/` – Minimal Express-based proxy ready for deployment.
  - `index.js` – HTTP entry point with OAuth handlers, token refresh, and Strava fetch helpers.
  - `package.json` – Dependencies and scripts for local development or Cloud Run builds.
  - `.env.example` – Documented environment variables required at runtime.

## Environment Variables

| Variable | Description |
| --- | --- |
| `STRAVA_CLIENT_ID` | OAuth client ID from https://www.strava.com/settings/api. |
| `STRAVA_CLIENT_SECRET` | OAuth client secret. Store securely (Secret Manager / Parameter Store). |
| `STRAVA_REDIRECT_URI` | Public URL for `/oauth/callback` on your proxy deployment. |
| `SESSION_SECRET` | Random string used to sign cookies. |
| `CACHE_TTL_SECONDS` | Optional. Controls how long activity payloads are cached (default 3600). |
| `ALLOWED_ORIGINS` | Comma-separated list of origins (e.g., `https://clarenceyeung.github.io`) for CORS + cookie validation. |

## Deployment Sketch

1. **Create a Strava API application** and set the callback URL to your deployed proxy (e.g., `https://strava-proxy-xyz.run.app/oauth/callback`).
2. **Provision storage** for tokens (Cloud Secret Manager, Firestore, DynamoDB). The provided code ships with an in-memory store for development; swap it out in `tokenStore.js` before production.
3. **Deploy the proxy** using Cloud Code / Cloud Run:
   ```bash
   gcloud run deploy strava-proxy \
     --source=cloud/strava-proxy \
     --region=us-central1 \
     --allow-unauthenticated \
     --set-env-vars STRAVA_CLIENT_ID=...,STRAVA_CLIENT_SECRET=...,STRAVA_REDIRECT_URI=...,SESSION_SECRET=...
   ```
4. **Schedule refreshes** (optional) by pointing Cloud Scheduler at `GET https://<proxy>/tasks/refresh`.
5. **Expose the base URL** to the front-end by defining `window.STRAVA_API_BASE` and (optionally) `window.STRAVA_CONNECT_URL` in a short inline script before `main.js` loads.

## Security Considerations

- The proxy issues an HTTP-only, SameSite=Lax cookie to map browser sessions to stored Strava credentials. Adjust the cookie policy if you intend to support cross-site embedding.
- Replace the default token store with a durable, encrypted solution before going live.
- Apply rate limiting and input validation if you expect the endpoint to be public beyond your own usage.

## Next Steps

1. Swap the placeholder token store for a persistent provider.
2. Wire the `/tasks/refresh` route into your scheduler of choice.
3. Update the clustering logic (if desired) server-side so the browser only receives already-clustered data.
4. Extend the API with additional endpoints (e.g., `/activities/:id`, `/athlete`) as needed for richer storytelling.

This scaffold should get you from the static demo into a production-ready flow quickly while keeping the deployment approachable.
