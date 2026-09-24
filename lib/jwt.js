import './slowbuffer-patch';
import jwt from 'jsonwebtoken';

// A development-only fallback keeps local setups working without a .env file.
// In production a missing JWT_SECRET is a configuration error, never a silent default.
const DEV_FALLBACK_SECRET = 'medisynix-local-development-secret';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim()) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return DEV_FALLBACK_SECRET;
}

// Generate a token from user data
export function generateToken(user) {
  return jwt.sign(
    {
      id: String(user.id || user._id), // Support both MongoDB _id and our internal id
      email: user.email,
      type: user.userType || user.type // Support both userType and type
    },
    getJwtSecret(),
    { expiresIn: '7d' } // Token expires in 7 days
  );
}

// Sign an arbitrary payload (e.g. short-lived AI Doctor session tokens)
export function signToken(payload, options) {
  return jwt.sign(payload, getJwtSecret(), options);
}

// Verify a token; returns the decoded payload or null
export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

// Read "Authorization: Bearer <token>" from a Fetch API Request or a Node/Pages API request
export function getBearerToken(req) {
  const header = typeof req.headers?.get === 'function'
    ? req.headers.get('authorization')
    : req.headers?.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

// Verify the request's login token. Returns { id, email, type } or null.
export function getAuthUser(req) {
  const decoded = verifyToken(getBearerToken(req));
  if (!decoded || !decoded.id) return null;
  return { id: String(decoded.id), email: decoded.email, type: decoded.type };
}

// True when `user` may access data belonging to `ownerId`
export function canAccessUser(user, ownerId) {
  return !!user && (user.type === 'admin' || String(ownerId) === user.id);
}
