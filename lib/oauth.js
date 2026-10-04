import crypto from 'crypto';

// Google and GitHub OAuth 2.0 (authorization code flow). Credentials come from
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.

export const STATE_COOKIE = 'medisynix_oauth_state';

const PROVIDERS = {
  google: {
    label: 'Google',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    extraAuthorizeParams: { prompt: 'select_account' },
  },
  github: {
    label: 'GitHub',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    extraAuthorizeParams: {},
  },
};

export function getProvider(name) {
  const provider = PROVIDERS[name];
  if (!provider) return null;
  const clientId = process.env[provider.clientIdEnv];
  const clientSecret = process.env[provider.clientSecretEnv];
  return { ...provider, name, clientId, clientSecret, configured: !!(clientId && clientSecret) };
}

// Absolute URL of this app. NEXT_PUBLIC_SITE_URL wins so the redirect URI matches the one
// registered with the provider even behind a proxy.
export function getSiteUrl(request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return (configured && configured.trim() ? configured : request.nextUrl.origin).replace(/\/$/, '');
}

export function getRedirectUri(request, providerName) {
  return `${getSiteUrl(request)}/api/auth/oauth/${providerName}/callback`;
}

export function createState() {
  return crypto.randomBytes(24).toString('hex');
}

export function buildAuthorizeUrl(provider, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider.scope,
    state,
    ...provider.extraAuthorizeParams,
  });
  return `${provider.authorizeUrl}?${params.toString()}`;
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error_description || body.error || body.message || `Request failed (${res.status})`);
  }
  return body;
}

async function exchangeCode(provider, code, redirectUri) {
  const body = await fetchJson(provider.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!body.access_token) throw new Error(body.error_description || body.error || 'No access token returned');
  return body.access_token;
}

function splitName(fullName, fallbackFirst) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || fallbackFirst || 'Medisynix',
    lastName: parts.slice(1).join(' ') || 'Patient',
  };
}

// Returns { email, firstName, lastName } for a verified provider account, or throws.
export async function fetchProfile(provider, code, redirectUri) {
  const accessToken = await exchangeCode(provider, code, redirectUri);

  if (provider.name === 'google') {
    const info = await fetchJson('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!info.email || !info.email_verified) throw new Error('unverified_email');
    const fallback = splitName(info.name, info.given_name);
    return {
      email: info.email,
      firstName: info.given_name || fallback.firstName,
      lastName: info.family_name || fallback.lastName,
    };
  }

  // GitHub: the profile email may be private or unverified, so use the verified primary address
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Medisynix',
  };
  const [user, emails] = await Promise.all([
    fetchJson('https://api.github.com/user', { headers }),
    fetchJson('https://api.github.com/user/emails', { headers }),
  ]);
  const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : null;
  if (!primary) throw new Error('unverified_email');
  const name = splitName(user.name, user.login);
  return { email: primary.email, ...name };
}
