import bcrypt from 'bcryptjs';
import { findUserByEmail, comparePassword, getUserHealthMetrics } from './static-data';

/**
 * Static demo authentication fallback.
 *
 * Used by the auth API routes so the platform stays fully navigable when a
 * live MongoDB connection is not available. It authenticates against the
 * demo accounts seeded by `lib/static-data.js`.
 */
export async function getStaticFallback(email, password, userType) {
  const user = findUserByEmail(email);
  if (!user || !user.password) return null;

  // Enforce the requested role only when one is supplied
  if (userType && user.userType !== userType) return null;

  const valid = await comparePassword(user.password, password);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    type: user.userType,
    userType: user.userType,
    weight: user.weight,
    height: user.height,
    bloodPressure: user.bloodPressure,
    heartRate: user.heartRate,
    glucoseLevel: user.glucoseLevel,
    reports: user.reports || [],
    appointments: user.appointments || [],
  };
}

/** Patient profile + metrics payload for dashboard pages (static fallback). */
export function getPatientFallback(userId) {
  const health = getUserHealthMetrics(userId);
  return { health };
}