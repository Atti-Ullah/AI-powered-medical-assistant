import crypto from 'crypto';
import { NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/db';
import User from '../../../../../../models/User';
import { generateToken } from '../../../../../../lib/jwt';
import { STATE_COOKIE, fetchProfile, getProvider, getRedirectUri, getSiteUrl } from '../../../../../../lib/oauth';
import { createUser, findUserByEmail, hashPassword } from '../../../../../../lib/static-data';

// Returns the patient account for a verified provider email, creating it on first sign-in.
// Doctor and admin accounts are created by the admin team and must use their password, so an
// email that belongs to one of them is rejected rather than linked.
async function findOrCreatePatient({ email, firstName, lastName }) {
  try {
    await dbConnect();
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: crypto.randomBytes(32).toString('hex'), // unusable random password, hashed by the model
        userType: 'patient',
      });
    }
    return {
      id: String(user._id),
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      userType: user.userType,
      suspended: user.status === 'suspended',
    };
  } catch (error) {
    console.error('DB OAuth sign-in unavailable, using static fallback:', error.message);

    let user = findUserByEmail(email);
    if (!user) {
      user = createUser({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: await hashPassword(crypto.randomBytes(32).toString('hex')),
        userType: 'patient',
      });
    }
    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      userType: user.userType,
      suspended: user.status === 'suspended',
    };
  }
}

export async function GET(request, { params }) {
  const { provider: providerName } = await params;
  const site = getSiteUrl(request);
  const fail = (code) => {
    const response = NextResponse.redirect(`${site}/login?error=${code}`);
    response.cookies.delete({ name: STATE_COOKIE, path: '/api/auth/oauth' });
    return response;
  };

  const provider = getProvider(providerName);
  if (!provider || !provider.configured) return fail('oauth_not_configured');

  const query = request.nextUrl.searchParams;
  if (query.get('error')) return fail('oauth_cancelled');

  // The state must match the one issued for this provider in /start
  const [cookieProvider, cookieState] = (request.cookies.get(STATE_COOKIE)?.value || '').split(':');
  const state = query.get('state');
  const code = query.get('code');
  const stateMatches =
    cookieProvider === provider.name &&
    !!cookieState &&
    !!state &&
    cookieState.length === state.length &&
    crypto.timingSafeEqual(Buffer.from(cookieState), Buffer.from(state));
  if (!stateMatches || !code) return fail('oauth_failed');

  let profile;
  try {
    profile = await fetchProfile(provider, code, getRedirectUri(request, provider.name));
  } catch (error) {
    console.error(`${provider.label} sign-in failed:`, error.message);
    return fail(error.message === 'unverified_email' ? 'oauth_unverified_email' : 'oauth_failed');
  }

  const account = await findOrCreatePatient(profile);
  if (account.userType !== 'patient') return fail('oauth_patient_only');
  if (account.suspended) return fail('oauth_suspended');

  const token = generateToken(account);
  const payload = Buffer.from(
    JSON.stringify({ id: account.id, email: account.email, name: account.name, type: account.userType, token })
  ).toString('base64url');

  // The session travels in the URL fragment, which browsers never send to servers or put in logs
  const response = NextResponse.redirect(`${site}/auth/callback#session=${payload}`);
  response.cookies.delete({ name: STATE_COOKIE, path: '/api/auth/oauth' });
  return response;
}
