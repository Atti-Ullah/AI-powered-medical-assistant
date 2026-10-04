import { NextResponse } from 'next/server';
import {
  STATE_COOKIE,
  buildAuthorizeUrl,
  createState,
  getProvider,
  getRedirectUri,
  getSiteUrl,
} from '../../../../../../lib/oauth';

// Sends the browser to Google/GitHub to sign in. A random `state` is stored in a short-lived
// httpOnly cookie and checked again in the callback to block cross-site request forgery.
export async function GET(request, { params }) {
  const { provider: providerName } = await params;
  const provider = getProvider(providerName);
  const site = getSiteUrl(request);

  if (!provider) {
    return NextResponse.redirect(`${site}/login?error=oauth_unknown_provider`);
  }
  if (!provider.configured) {
    console.warn(`${provider.label} sign-in is not configured: set ${provider.clientIdEnv} and ${provider.clientSecretEnv}.`);
    return NextResponse.redirect(`${site}/login?error=oauth_not_configured&provider=${provider.name}`);
  }

  const state = createState();
  const response = NextResponse.redirect(buildAuthorizeUrl(provider, getRedirectUri(request, provider.name), state));
  response.cookies.set(STATE_COOKIE, `${provider.name}:${state}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/oauth',
    maxAge: 600,
  });
  return response;
}
