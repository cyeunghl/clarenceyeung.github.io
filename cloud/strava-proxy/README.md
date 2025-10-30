# Clarence Strava Proxy (Sample)

A lightweight Express server that brokers OAuth and activity requests between the static portfolio and the Strava API. Use it as a starting point and swap the token store for your preferred managed service before deploying to production.

## Quick Start

```bash
cd cloud/strava-proxy
cp .env.example .env
npm install
npm run dev
```

The server listens on port `8788` by default. Update `.env` with your Strava credentials and set `ALLOWED_ORIGINS` to include the domains where the portfolio runs.

## Environment Variables

See [../README.md](../README.md) for a full explanation. The proxy expects the following at minimum:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI`
- `SESSION_SECRET`

## Front-End Wiring

Embed a short script before `main.js` to point the static site at the proxy:

```html
<script>
  window.STRAVA_API_BASE = 'https://your-proxy-domain';
  window.STRAVA_CONNECT_URL = 'https://your-proxy-domain/oauth/start';
</script>
```

The **Connect Strava Account** button will open the OAuth flow and the globe will consume `/activities` with cookies attached.

## Production Checklist

- Replace the in-memory token store in `tokenStore.js` with a persistent provider (Secret Manager, Firestore, DynamoDB, etc.).
- Turn on HTTPS-only cookies by setting `NODE_ENV=production` during deployment.
- Add logging/monitoring (Cloud Logging, Datadog, etc.).
- Protect `/tasks/refresh` with a scheduler-specific token if exposed publicly.
