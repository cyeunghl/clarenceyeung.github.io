const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_TOKEN_ENDPOINT = 'https://www.strava.com/oauth/token';
const SESSION_COOKIE = 'clarence_strava_session';

function generateId(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function saveSession(env, sessionId, data, ttlSeconds = 3600) {
  if (!env.STRAVA_SESSIONS) {
    throw new Error('Missing STRAVA_SESSIONS KV namespace');
  }
  await env.STRAVA_SESSIONS.put(sessionId, JSON.stringify(data), {
    expirationTtl: ttlSeconds,
  });
}

async function readSession(env, sessionId) {
  if (!env.STRAVA_SESSIONS) {
    throw new Error('Missing STRAVA_SESSIONS KV namespace');
  }
  const raw = await env.STRAVA_SESSIONS.get(sessionId);
  return raw ? JSON.parse(raw) : null;
}

async function exchangeCodeForToken(env, code) {
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    client_secret: env.STRAVA_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(STRAVA_TOKEN_ENDPOINT, {
    method: 'POST',
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.status}`);
  }

  return response.json();
}

async function refreshAccessToken(env, refreshToken) {
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    client_secret: env.STRAVA_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(STRAVA_TOKEN_ENDPOINT, {
    method: 'POST',
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Strava token: ${response.status}`);
  }

  return response.json();
}

function buildRedirect(url, state, env) {
  const redirect = new URL('https://www.strava.com/oauth/authorize');
  redirect.search = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    redirect_uri: env.STRAVA_REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read,activity:read_all',
    state,
  }).toString();
  return redirect;
}

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const cookies = cookie.split(';').map((part) => part.trim());
  const match = cookies.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function buildCookie(sessionId) {
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

async function handleAuthStart(request, env) {
  const sessionId = generateId(24);
  const state = generateId(18);
  await saveSession(env, `state:${state}`, { sessionId }, 600);

  const headers = new Headers();
  headers.set('Location', buildRedirect(request.url, state, env));
  headers.append('Set-Cookie', buildCookie(sessionId));

  return new Response(null, { status: 302, headers });
}

async function handleAuthCallback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (!state || !code) {
    return new Response('Missing OAuth state or code.', { status: 400 });
  }

  const stateRecord = await readSession(env, `state:${state}`);
  if (!stateRecord) {
    return new Response('Invalid or expired OAuth state.', { status: 400 });
  }

  const sessionId = stateRecord.sessionId;
  const tokenPayload = await exchangeCodeForToken(env, code);
  const expiresAt = tokenPayload.expires_at ? tokenPayload.expires_at * 1000 : Date.now() + 3600000;

  await saveSession(env, sessionId, {
    athlete: tokenPayload.athlete,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token,
    expiresAt,
  });

  await env.STRAVA_SESSIONS.delete(`state:${state}`);

  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
  });
  headers.append('Set-Cookie', buildCookie(sessionId));

  const html = `<!doctype html><html><body style="font-family: sans-serif; background:#0f1410; color:#f2f0e9; text-align:center; padding:3rem;">
    <h1>Strava connected</h1>
    <p>You can close this window and refresh the portfolio.</p>
    <script>setTimeout(() => window.close(), 2000);</script>
  </body></html>`;

  return new Response(html, { status: 200, headers });
}

async function withAccessToken(env, sessionId, fn) {
  const session = await readSession(env, sessionId);
  if (!session) {
    throw new Response('Unauthenticated', { status: 401 });
  }

  let { accessToken, refreshToken, expiresAt } = session;
  const now = Date.now();
  if (!accessToken || now > (expiresAt || 0) - 60000) {
    if (!refreshToken) {
      throw new Response('Session expired', { status: 401 });
    }
    const refreshPayload = await refreshAccessToken(env, refreshToken);
    accessToken = refreshPayload.access_token;
    refreshToken = refreshPayload.refresh_token || refreshToken;
    expiresAt = refreshPayload.expires_at ? refreshPayload.expires_at * 1000 : now + 3600000;
    await saveSession(env, sessionId, {
      ...session,
      accessToken,
      refreshToken,
      expiresAt,
    });
  }

  return fn(accessToken);
}

async function handleActivities(request, env) {
  const sessionId = getCookie(request, SESSION_COOKIE);
  if (!sessionId) {
    return new Response(JSON.stringify({ activities: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await withAccessToken(env, sessionId, async (accessToken) => {
      const after = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
      const response = await fetch(`${STRAVA_API_BASE}/athlete/activities?after=${after}&per_page=200`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Strava API error: ${response.status}`);
      }

      const activities = await response.json();
      return {
        activities: activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          type: activity.type,
          distance: activity.distance,
          start_date: activity.start_date,
          coordinates: activity.start_latlng || activity.end_latlng,
          city: activity.location_city,
          country: activity.location_country,
        })),
        syncedAt: new Date().toISOString(),
      };
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth/strava') {
      return handleAuthStart(request, env);
    }

    if (url.pathname === '/auth/strava/callback') {
      return handleAuthCallback(request, env);
    }

    if (url.pathname === '/api/strava/activities') {
      return handleActivities(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};
