import dbConnect from './db';
import User from '../models/User';
import { findUserById } from './static-data';

// Whether a live MongoDB connection is available (otherwise the static store is used)
// A failed attempt is remembered briefly so one request does not wait on the timeout repeatedly
let lastFailureAt = 0;
export async function isDatabaseConnected() {
  if (Date.now() - lastFailureAt < 5000) return false;
  try {
    await dbConnect();
    return true;
  } catch {
    lastFailureAt = Date.now();
    return false;
  }
}

// 'active' | 'suspended' | 'missing' for the account a login token was issued to
export async function getAccountState(id) {
  const userId = String(id || '');
  let user = null;
  if (await isDatabaseConnected()) {
    user = /^[a-f\d]{24}$/i.test(userId) ? await User.findById(userId).select('status').lean() : null;
  } else {
    user = findUserById(userId);
  }
  if (!user) return 'missing';
  return user.status === 'suspended' ? 'suspended' : 'active';
}

// Ends the request and returns true when the token belongs to a deleted or suspended account
export async function rejectInactiveAccount(res, authUser) {
  const state = await getAccountState(authUser.id);
  if (state === 'active') return false;
  const message = state === 'suspended'
    ? 'This account has been suspended. Please contact an administrator.'
    : 'This account no longer exists';
  res.status(state === 'suspended' ? 403 : 401).json({ success: false, message });
  return true;
}

// Same check for App Router handlers, which return a Response instead of using `res`
export async function inactiveAccountResponse(authUser) {
  const state = await getAccountState(authUser.id);
  if (state === 'active') return null;
  const suspended = state === 'suspended';
  return Response.json(
    { success: false, message: suspended ? 'This account has been suspended. Please contact an administrator.' : 'This account no longer exists' },
    { status: suspended ? 403 : 401 }
  );
}
