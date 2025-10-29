import express from 'express';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createTokenStore } from './tokenStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8788;
const SESSION_COOKIE = 'clarence_strava_session';
const STATE_COOKIE = 'clarence_strava_state';
const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  signed: true,
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 60, // ~60 days
};

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const cacheTtl = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10);
const stravaClientId = process.env.STRAVA_CLIENT_ID;
const stravaClientSecret = process.env.STRAVA_CLIENT_SECRET;
const stravaRedirectUri = process.env.STRAVA_REDIRECT_URI;

if (!stravaClientId || !stravaClientSecret || !stravaRedirectUri) {
  console.warn('[strava-proxy] Missing STRAVA_CLIENT_ID/SECRET/REDIRECT_URI. OAuth flow will fail.');
}

const tokenStore = createTokenStore();

app.use(cookieParser(process.env.SESSION_SECRET || 'clarence-dev-secret'));
app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

function ensureSession(req, res) {
  let sessionId = req.signedCookies[SESSION_COOKIE];
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
  return sessionId;
}

function shapeActivity(activity) {
  const [lat, lon] = activity.start_latlng || [];
  return {
    id: activity.id,
    name: activity.name,
    type: activity.type,
    start_date: activity.start_date,
    distance: activity.distance,
    coordinates: [lat, lon],
    city: activity.location_city || '',
    country: activity.location_country || '',
  };
}

async function refreshAccessToken(tokens) {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Strava token (${response.status})`);
  }

  const json = await response.json();
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token || tokens.refresh_token,
    expires_at: json.expires_at,
  };
}

async function fetchActivityPayload(tokens) {
  const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=200', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Strava activities request failed (${response.status})`);
  }

  const json = await response.json();
  return {
    updatedAt: new Date().toISOString(),
    activities: json
      .filter((item) => Array.isArray(item.start_latlng) && item.start_latlng.length === 2)
      .map(shapeActivity),
  };
}

app.get('/oauth/start', async (req, res) => {
  if (!stravaClientId || !stravaRedirectUri) {
    res.status(500).json({ error: 'Strava client not configured.' });
    return;
  }

  const sessionId = ensureSession(req, res);
  const state = crypto.randomUUID();
  res.cookie(STATE_COOKIE, state, { ...COOKIE_OPTIONS, maxAge: 1000 * 60 * 10 });

  await tokenStore.set(sessionId, {
    ...(await tokenStore.get(sessionId)),
    oauthState: state,
  });

  const authorizeUrl = new URL('https://www.strava.com/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', stravaClientId);
  authorizeUrl.searchParams.set('redirect_uri', stravaRedirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('approval_prompt', 'auto');
  authorizeUrl.searchParams.set('scope', 'activity:read_all');
  authorizeUrl.searchParams.set('state', state);

  res.redirect(authorizeUrl.toString());
});

app.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const stateCookie = req.signedCookies[STATE_COOKIE];
  const sessionId = req.signedCookies[SESSION_COOKIE];

  if (error) {
    res.status(400).send(`Strava authorization failed: ${error}`);
    return;
  }

  if (!code || !state || !sessionId || state !== stateCookie) {
    res.status(400).send('Invalid or expired OAuth state.');
    return;
  }

  const stored = await tokenStore.get(sessionId);
  if (!stored || stored.oauthState !== state) {
    res.status(400).send('Session mismatch. Restart the connection process.');
    return;
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: stravaClientId,
        client_secret: stravaClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: stravaRedirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed (${response.status})`);
    }

    const json = await response.json();
    await tokenStore.set(sessionId, {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: json.expires_at,
      oauthState: null,
      activityCache: null,
    });

    res.clearCookie(STATE_COOKIE, {
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
    });
    res.status(200).send('<p>Strava connected. You may close this tab.</p>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to complete Strava authorization.');
  }
});

app.get('/activities', async (req, res) => {
  const sessionId = req.signedCookies[SESSION_COOKIE];
  if (!sessionId) {
    res.status(401).json({ error: 'Not authenticated with Strava.' });
    return;
  }

  const stored = await tokenStore.get(sessionId);
  if (!stored || !stored.access_token) {
    res.status(401).json({ error: 'Connect Strava to unlock activities.' });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  let tokens = stored;
  if (stored.expires_at && stored.expires_at < now + 60) {
    try {
      const refreshed = await refreshAccessToken(stored);
      tokens = { ...stored, ...refreshed };
      await tokenStore.set(sessionId, tokens);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to refresh Strava credentials.' });
      return;
    }
  }

  const cached = tokens.activityCache;
  if (cached && cached.expiresAt > Date.now()) {
    res.json(cached.payload);
    return;
  }

  try {
    const payload = await fetchActivityPayload(tokens);
    const enriched = { ...tokens, activityCache: { payload, expiresAt: Date.now() + cacheTtl * 1000 } };
    await tokenStore.set(sessionId, enriched);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Unable to fetch Strava activities.' });
  }
});

app.get('/tasks/refresh', async (req, res) => {
  const entries = await tokenStore.entries();
  await Promise.all(
    entries.map(async ([sessionId, data]) => {
      if (!data || !data.access_token) return;
      try {
        const payload = await fetchActivityPayload(data);
        const enriched = {
          ...data,
          activityCache: { payload, expiresAt: Date.now() + cacheTtl * 1000 },
        };
        await tokenStore.set(sessionId, enriched);
      } catch (err) {
        console.error('Failed scheduled refresh for session', sessionId, err);
      }
    })
  );
  res.status(204).end();
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Strava proxy ready.' });
});

app.listen(PORT, () => {
  console.log(`Strava proxy listening on :${PORT}`);
});
