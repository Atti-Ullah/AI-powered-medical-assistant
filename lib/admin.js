import bcrypt from 'bcryptjs';
import dbConnect from './db';
import User from '../models/User';
import Appointment from '../models/Appointment';
import HealthMetric from '../models/HealthMetric';
import mongoose from 'mongoose';
import {
  getAllUsers as getStaticUsers,
  findUserById as findStaticUser,
  findUserByEmail as findStaticUserByEmail,
  createUser as createStaticUser,
  updateUserProfile as updateStaticUser,
  deleteUser as deleteStaticUser,
  removeUserData as removeStaticUserData,
  hashPassword,
  getAllAppointments,
} from './static-data';
import { getAuthUser } from './jwt';
import { buildAlerts } from './admin-client';
import {
  ADMIN_ROLES,
  ADMIN_DEPARTMENTS,
  ADMIN_PERMISSIONS,
  PROFILE_DEFAULTS,
  MAX_AVATAR_LENGTH,
} from './admin-profile';

export const USER_TYPES = ['patient', 'doctor', 'admin'];
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include upper and lower case letters, a number and a special character';

// Domain error that maps straight to an HTTP response
export class AdminError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Ends the request and returns null unless the caller is a logged-in administrator
export function requireAdmin(req, res) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return null;
  }
  if (authUser.type !== 'admin') {
    res.status(403).json({ success: false, message: 'Administrator access required' });
    return null;
  }
  return authUser;
}

export function sendAdminError(res, error) {
  if (error instanceof AdminError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error('Admin API error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

// Strip secrets and normalise MongoDB / static records to one shape
export function toPublicUser(user) {
  const id = String(user.id || user._id);
  return {
    id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    type: user.userType,
    phone: user.phone || '',
    specialty: user.specialty || '',
    experience: user.experience || '',
    education: user.education || '',
    status: 'active',
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    date: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
  };
}

function validPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[\W_]/.test(password)
  );
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

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

async function loadRawUsers() {
  if (await isDatabaseConnected()) {
    return { source: 'mongodb', users: await User.find().sort({ createdAt: -1 }).lean() };
  }
  return { source: 'static', users: [...getStaticUsers()] };
}

export async function listUsers({ search = '', type = '' } = {}) {
  const { users } = await loadRawUsers();
  const term = search.trim().toLowerCase();
  return users
    .map(toPublicUser)
    .filter((u) => !type || u.type === type)
    .filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function getUser(id) {
  if (await isDatabaseConnected()) {
    const user = /^[a-f\d]{24}$/i.test(id) ? await User.findById(id).lean() : null;
    if (!user) throw new AdminError(404, 'User not found');
    return toPublicUser(user);
  }
  const user = findStaticUser(id);
  if (!user) throw new AdminError(404, 'User not found');
  return toPublicUser(user);
}

async function countAdmins() {
  const { users } = await loadRawUsers();
  return users.filter((u) => u.userType === 'admin').length;
}

export async function createAccount(body = {}) {
  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const email = str(body.email).toLowerCase();
  const userType = str(body.userType) || 'patient';

  if (!firstName || !lastName || !email || typeof body.password !== 'string') {
    throw new AdminError(400, 'First name, last name, email and password are required');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AdminError(400, 'Email is invalid');
  if (!validPassword(body.password)) throw new AdminError(400, PASSWORD_MESSAGE);
  if (!USER_TYPES.includes(userType)) throw new AdminError(400, 'User type must be patient, doctor or admin');

  const extra = userType === 'doctor'
    ? { specialty: str(body.specialty), experience: str(body.experience), education: str(body.education) }
    : {};
  const phone = str(body.phone);

  if (await isDatabaseConnected()) {
    if (await User.findOne({ email })) throw new AdminError(409, 'Email already registered');
    const user = new User({ firstName, lastName, email, password: body.password, userType, phone, ...extra });
    await user.save();
    return toPublicUser(user.toObject());
  }

  if (findStaticUserByEmail(email)) throw new AdminError(409, 'Email already registered');
  const created = createStaticUser({
    firstName,
    lastName,
    email,
    password: await hashPassword(body.password),
    userType,
    phone,
    ...extra,
  });
  return toPublicUser(created);
}

export async function updateAccount(id, body = {}, actingUser) {
  const updates = {};
  if (body.firstName !== undefined) updates.firstName = str(body.firstName);
  if (body.lastName !== undefined) updates.lastName = str(body.lastName);
  if (body.email !== undefined) updates.email = str(body.email).toLowerCase();
  if (body.phone !== undefined) updates.phone = str(body.phone);
  if (body.userType !== undefined) updates.userType = str(body.userType);
  for (const field of ['specialty', 'experience', 'education']) {
    if (body[field] !== undefined) updates[field] = str(body[field]);
  }

  if ('firstName' in updates && !updates.firstName) throw new AdminError(400, 'First name cannot be empty');
  if ('lastName' in updates && !updates.lastName) throw new AdminError(400, 'Last name cannot be empty');
  if ('email' in updates && !/^\S+@\S+\.\S+$/.test(updates.email)) throw new AdminError(400, 'Email is invalid');
  if ('userType' in updates && !USER_TYPES.includes(updates.userType)) {
    throw new AdminError(400, 'User type must be patient, doctor or admin');
  }
  if (body.password && !validPassword(body.password)) throw new AdminError(400, PASSWORD_MESSAGE);

  const current = await getUser(id);
  if (updates.userType && updates.userType !== current.type && current.type === 'admin') {
    if (String(actingUser.id) === id) throw new AdminError(400, 'You cannot change your own role');
    if ((await countAdmins()) <= 1) throw new AdminError(400, 'The last administrator cannot be demoted');
  }

  if (await isDatabaseConnected()) {
    if (updates.email && updates.email !== current.email && (await User.findOne({ email: updates.email }))) {
      throw new AdminError(409, 'Email already registered');
    }
    const user = await User.findById(id);
    Object.assign(user, updates, { updatedAt: new Date() });
    if (body.password) user.password = body.password; // hashed by the pre-save hook
    await user.save();
    return toPublicUser(user.toObject());
  }

  const clash = updates.email && findStaticUserByEmail(updates.email);
  if (clash && clash.id !== id) throw new AdminError(409, 'Email already registered');
  if (body.password) updates.password = await hashPassword(body.password);
  return toPublicUser(updateStaticUser(id, updates));
}

export async function deleteAccount(id, actingUser) {
  if (String(actingUser.id) === id) throw new AdminError(400, 'You cannot delete your own account');
  const current = await getUser(id);
  if (current.type === 'admin' && (await countAdmins()) <= 1) {
    throw new AdminError(400, 'The last administrator cannot be deleted');
  }
  if (await isDatabaseConnected()) {
    await User.deleteOne({ _id: id });
    // Remove the account's data so it does not linger in statistics
    await Appointment.deleteMany({ patientId: id });
    await Appointment.updateMany({ doctorId: id, status: { $nin: ['cancelled', 'completed'] } }, { $set: { status: 'cancelled', updatedAt: new Date() } });
    await HealthMetric.deleteMany({ userId: id });
    for (const name of ['medical_records', 'medications']) {
      await mongoose.connection.collection(name).deleteMany({ userId: id });
    }
  } else {
    deleteStaticUser(id);
    removeStaticUserData(id);
  }
  return current;
}

// Platform health / statistics for the status dialog, alerts, analytics and security pages
export async function getSystemStatus() {
  const connected = await isDatabaseConnected();
  const { users } = await loadRawUsers();

  const appointments = connected
    ? await Appointment.find().select('status').lean()
    : getAllAppointments();

  const appointmentsByStatus = appointments.reduce((acc, appt) => {
    const status = appt.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const usersByType = users.reduce((acc, u) => {
    acc[u.userType] = (acc[u.userType] || 0) + 1;
    return acc;
  }, {});

  // Is any administrator still using the documented demo password?
  let defaultAdminPassword = false;
  for (const admin of users.filter((u) => u.userType === 'admin' && u.password)) {
    if (await bcrypt.compare('admin123', admin.password)) {
      defaultAdminPassword = true;
      break;
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    database: { connected, mode: connected ? 'mongodb' : 'static-fallback' },
    server: {
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    },
    security: {
      jwtSecretConfigured: !!(process.env.JWT_SECRET && process.env.JWT_SECRET.trim()),
      defaultAdminPassword,
      adminCount: usersByType.admin || 0,
      tokenLifetime: '7 days',
    },
    config: {
      aiAssistantConfigured: !!(process.env.GEMINI_API_KEY && !/^your_/.test(process.env.GEMINI_API_KEY)),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    totals: {
      users: users.length,
      usersByType,
      appointments: appointments.length,
      appointmentsByStatus,
    },
  };
}

// Lets the logged-in administrator change their own password after proving they know the current one
export async function changeOwnPassword(userId, currentPassword, newPassword) {
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
    throw new AdminError(400, 'Current password and new password are required');
  }
  if (!validPassword(newPassword)) throw new AdminError(400, PASSWORD_MESSAGE);
  if (newPassword === currentPassword) {
    throw new AdminError(400, 'New password must be different from the current password');
  }

  if (await isDatabaseConnected()) {
    const user = /^[a-f\d]{24}$/i.test(userId) ? await User.findById(userId) : null;
    if (!user) throw new AdminError(404, 'User not found');
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new AdminError(400, 'Current password is incorrect');
    }
    user.password = newPassword; // hashed by the pre-save hook
    user.updatedAt = new Date();
    await user.save();
    return;
  }

  const user = findStaticUser(userId);
  if (!user) throw new AdminError(404, 'User not found');
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new AdminError(400, 'Current password is incorrect');
  }
  updateStaticUser(userId, { password: await hashPassword(newPassword) });
}

// ---------------------------------------------------------------------------
// Administrator's own profile
// ---------------------------------------------------------------------------

function toProfile(user) {
  const base = toPublicUser(user);
  return {
    id: base.id,
    name: base.name,
    firstName: base.firstName,
    lastName: base.lastName,
    email: base.email,
    phone: base.phone,
    adminRole: user.adminRole || PROFILE_DEFAULTS.adminRole,
    department: user.department || PROFILE_DEFAULTS.department,
    permissions: user.permissions || PROFILE_DEFAULTS.permissions,
    avatar: user.avatar || '',
    joinDate: base.date,
  };
}

async function loadOwnRecord(userId) {
  if (await isDatabaseConnected()) {
    const user = /^[a-f\d]{24}$/i.test(userId) ? await User.findById(userId).lean() : null;
    if (!user) throw new AdminError(404, 'User not found');
    return { source: 'mongodb', user };
  }
  const user = findStaticUser(userId);
  if (!user) throw new AdminError(404, 'User not found');
  return { source: 'static', user };
}

export async function getOwnProfile(userId) {
  const { user } = await loadOwnRecord(userId);
  return toProfile(user);
}

export async function updateOwnProfile(userId, body = {}) {
  const updates = {};

  if (body.name !== undefined) {
    const parts = str(body.name).split(/\s+/).filter(Boolean);
    if (parts.length === 0) throw new AdminError(400, 'Full name is required');
    if (str(body.name).length > 100) throw new AdminError(400, 'Full name is too long');
    updates.firstName = parts[0];
    updates.lastName = parts.slice(1).join(' ');
  }

  if (body.phone !== undefined) {
    const phone = str(body.phone);
    if (phone && !/^[+\d][\d\s()-]{5,19}$/.test(phone)) {
      throw new AdminError(400, 'Phone number is invalid');
    }
    updates.phone = phone;
  }

  const choices = [
    ['adminRole', ADMIN_ROLES, 'Administrative role'],
    ['department', ADMIN_DEPARTMENTS, 'Department'],
    ['permissions', ADMIN_PERMISSIONS, 'System permissions'],
  ];
  for (const [field, allowed, label] of choices) {
    if (body[field] !== undefined) {
      if (!allowed.includes(body[field])) throw new AdminError(400, `${label} is not a valid option`);
      updates[field] = body[field];
    }
  }

  if (body.avatar !== undefined) {
    if (body.avatar === '' || body.avatar === null) {
      updates.avatar = '';
    } else if (
      typeof body.avatar !== 'string' ||
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(body.avatar)
    ) {
      throw new AdminError(400, 'Profile picture must be a PNG, JPEG or WebP image');
    } else if (body.avatar.length > MAX_AVATAR_LENGTH) {
      throw new AdminError(400, 'Profile picture is too large');
    } else {
      updates.avatar = body.avatar;
    }
  }

  const { source, user } = await loadOwnRecord(userId);
  if (source === 'mongodb') {
    const doc = await User.findById(userId);
    Object.assign(doc, updates, { updatedAt: new Date() });
    await doc.save();
    return toProfile(doc.toObject());
  }
  return toProfile(updateStaticUser(user.id, updates));
}

// ---------------------------------------------------------------------------
// Notifications: alerts from the health check plus recent platform activity
// ---------------------------------------------------------------------------

const NOTIFICATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getNotifications() {
  const status = await getSystemStatus();
  const { users } = await loadRawUsers();
  const connected = status.database.connected;
  const appointments = connected
    ? await Appointment.find().lean()
    : getAllAppointments();

  const since = Date.now() - NOTIFICATION_WINDOW_MS;
  const items = [];

  // Problems worth an administrator's attention (informational alerts are not notifications)
  for (const alert of buildAlerts(status).filter((a) => a.severity !== 'info')) {
    items.push({
      id: `alert-${alert.id}`,
      type: 'alert',
      severity: alert.severity,
      title: alert.title,
      text: alert.description,
      createdAt: status.checkedAt,
      href: alert.id === 'admin-password' ? '/dashboard/admin/settings' : '/dashboard/admin/alerts',
    });
  }

  // New accounts
  const names = new Map();
  for (const u of users) {
    const pub = toPublicUser(u);
    names.set(pub.id, pub.name);
    if (u.createdAt && new Date(u.createdAt).getTime() >= since) {
      items.push({
        id: `user-${pub.id}`,
        type: 'user',
        severity: 'info',
        title: `New ${pub.type} account`,
        text: `${pub.name} (${pub.email}) joined the platform.`,
        createdAt: new Date(u.createdAt).toISOString(),
        href: `/dashboard/admin/users/${pub.id}`,
      });
    }
  }

  // Appointment activity
  for (const appt of appointments) {
    const id = String(appt.id || appt._id);
    const patient = appt.patientName || names.get(String(appt.patientId)) || 'A patient';
    const doctor = appt.doctorName || 'a doctor';
    const created = appt.createdAt ? new Date(appt.createdAt).getTime() : 0;
    const updated = appt.updatedAt ? new Date(appt.updatedAt).getTime() : 0;
    if (appt.status === 'cancelled' && updated >= since) {
      items.push({
        id: `appt-${id}-cancelled`,
        type: 'appointment',
        severity: 'warning',
        title: 'Appointment cancelled',
        text: `${patient} cancelled the appointment with ${doctor} on ${appt.date}.`,
        createdAt: new Date(updated).toISOString(),
        href: '/dashboard/admin/analytics',
      });
    } else if (created >= since) {
      items.push({
        id: `appt-${id}-created`,
        type: 'appointment',
        severity: 'info',
        title: 'New appointment booked',
        text: `${patient} booked ${doctor} for ${appt.date} at ${appt.time}.`,
        createdAt: new Date(created).toISOString(),
        href: '/dashboard/admin/analytics',
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);
}
