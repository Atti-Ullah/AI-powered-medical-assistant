import mongoose from 'mongoose';
import User from '../models/User';
import Appointment from '../models/Appointment';
import HealthMetric from '../models/HealthMetric';
import {
  getAllAppointments,
  updateAppointment as updateStaticAppointment,
  findUserById as findStaticUser,
  updateUserProfile as updateStaticUser,
  getUserHealthMetrics,
  getMedicalRecords,
  getMedications,
  addMedicalRecord,
} from './static-data';
import { getAuthUser } from './jwt';
import { AdminError, isDatabaseConnected } from './admin';
import { analyzePatient, ageFromDateOfBirth, calculateBmi, SEVERITY_ORDER } from './patient-analysis';
import {
  DOCTOR_SPECIALTIES,
  DOCTOR_LOCATIONS,
  DOCTOR_LANGUAGES,
  DOCTOR_TIME_SLOTS,
  DEFAULT_TIME_SLOTS,
  MAX_AVATAR_LENGTH,
  MAX_REPORT_FILE_LENGTH,
  REPORT_IMAGE_MODALITIES,
  REPORT_LAB_TESTS,
} from './doctor-profile';

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

// Ends the request and returns null unless the caller is a logged-in doctor
export function requireDoctor(req, res) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return null;
  }
  if (authUser.type !== 'doctor') {
    res.status(403).json({ success: false, message: 'Doctor access required' });
    return null;
  }
  return authUser;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v));
const ACTIVE_HIDDEN = ['cancelled', 'completed'];
export const isActiveStatus = (status) => !ACTIVE_HIDDEN.includes(status);

// YYYY-MM-DD in the server's local time zone
export function localDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "10:00 AM" -> minutes since midnight, so bookings sort by real time
function timeToMinutes(time) {
  const match = String(time || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = Number(match[1]) % 12;
  if (/pm/i.test(match[3] || '')) hours += 12;
  else if (!match[3]) hours = Number(match[1]);
  return hours * 60 + Number(match[2]);
}

const byDateTime = (a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.time) - timeToMinutes(b.time);

function normalizeAppointment(a) {
  return {
    id: String(a.id || a._id),
    patientId: String(a.patientId),
    patientName: a.patientName || '',
    doctorId: a.doctorId ? String(a.doctorId) : '',
    doctorName: a.doctorName || '',
    date: a.date || '',
    time: a.time || '',
    reason: a.reason || '',
    status: a.status || 'upcoming',
    diagnosis: a.diagnosis || '',
    doctorNotes: a.doctorNotes || '',
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
    updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : null,
  };
}

function normalizePatient(user, fallbackName = 'Unknown patient') {
  if (!user) {
    return { id: '', name: fallbackName, email: '', phone: '', gender: '', dateOfBirth: '', age: null, bloodType: '', allergies: '', medicalConditions: '', medications: '' };
  }
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || fallbackName;
  return {
    id: String(user.id || user._id),
    name,
    email: user.email || '',
    phone: user.phone || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    age: ageFromDateOfBirth(user.dateOfBirth),
    bloodType: user.bloodType || '',
    allergies: user.allergies || '',
    medicalConditions: user.medicalConditions || '',
    medications: user.medications || '',
  };
}

function normalizeMetric(m) {
  if (!m) return null;
  const bmi = m.bmi || calculateBmi(m.height, m.weight);
  return {
    height: m.height ?? null,
    weight: m.weight ?? null,
    bloodPressure: m.bloodPressure || '',
    heartRate: m.heartRate ?? null,
    glucoseLevel: m.glucoseLevel ?? null,
    bmi: bmi || null,
    bmiStatus: m.bmiStatus || '',
    timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Data loading (MongoDB when reachable, otherwise the local file store)
// ---------------------------------------------------------------------------

async function loadAppointmentsFor(doctorId) {
  if (await isDatabaseConnected()) {
    return (await Appointment.find({ doctorId }).lean()).map(normalizeAppointment);
  }
  return getAllAppointments().filter((a) => String(a.doctorId) === doctorId).map(normalizeAppointment);
}

// Everything the doctor may see about the patients they have appointments with
async function loadDoctorData(doctorId) {
  const appointments = await loadAppointmentsFor(doctorId);
  const patientIds = [...new Set(appointments.map((a) => a.patientId))];
  const connected = await isDatabaseConnected();

  const users = new Map();
  const metrics = new Map(); // patientId -> { current, history }
  const recordCounts = new Map();
  const medicationCounts = new Map();

  if (connected) {
    const objectIds = patientIds.filter(isObjectId);
    for (const u of await User.find({ _id: { $in: objectIds } }).lean()) users.set(String(u._id), u);
    const rows = await HealthMetric.find({ userId: { $in: patientIds } }).sort({ timestamp: -1 }).lean();
    for (const row of rows) {
      const entry = metrics.get(row.userId) || { current: null, history: [] };
      if (!entry.current) entry.current = row;
      entry.history.push(row);
      metrics.set(row.userId, entry);
    }
    for (const [name, target] of [['medical_records', recordCounts], ['medications', medicationCounts]]) {
      for (const item of await mongoose.connection.collection(name).find({ userId: { $in: patientIds } }).toArray()) {
        target.set(item.userId, (target.get(item.userId) || 0) + 1);
      }
    }
  } else {
    for (const id of patientIds) {
      const u = findStaticUser(id);
      if (u) users.set(id, u);
      const m = getUserHealthMetrics(id);
      const history = [...(m.history || [])].reverse();
      metrics.set(id, { current: m.current && Object.keys(m.current).length ? m.current : null, history });
      recordCounts.set(id, getMedicalRecords(id).length);
      medicationCounts.set(id, getMedications(id).length);
    }
  }
  return { appointments, patientIds, users, metrics, recordCounts, medicationCounts };
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

function buildPatientSummaries(data) {
  const today = localDate();
  const summaries = [];
  for (const id of data.patientIds) {
    const own = data.appointments.filter((a) => a.patientId === id);
    const user = data.users.get(id);
    if (!user) continue; // the account no longer exists
    const patient = { ...normalizePatient(user, own[0]?.patientName), id };
    const current = normalizeMetric(data.metrics.get(id)?.current);
    const analysis = analyzePatient(current, patient);
    const completed = own.filter((a) => a.status === 'completed').sort(byDateTime);
    const upcoming = own.filter((a) => isActiveStatus(a.status) && a.date >= today).sort(byDateTime);
    const lastActivity = [...own].sort(byDateTime).pop();
    summaries.push({
      ...patient,
      appointments: own.length,
      completedVisits: completed.length,
      lastVisit: completed.length ? completed[completed.length - 1].date : null,
      nextAppointment: upcoming[0] ? { id: upcoming[0].id, date: upcoming[0].date, time: upcoming[0].time, reason: upcoming[0].reason } : null,
      lastActivityDate: lastActivity ? lastActivity.date : '',
      recordCount: data.recordCounts.get(id) || 0,
      medicationCount: data.medicationCounts.get(id) || 0,
      vitals: current,
      risk: analysis.risk,
      topFlag: analysis.flags.find((f) => f.severity !== 'info') || null,
      flagCount: analysis.flags.filter((f) => f.severity !== 'info').length,
    });
  }
  return summaries;
}

const RISK_ORDER = { high: 0, medium: 1, low: 2, none: 3, unknown: 4 };

export async function listPatients(doctorId, { search = '', filter = '' } = {}) {
  const data = await loadDoctorData(doctorId);
  const term = search.trim().toLowerCase();
  let list = buildPatientSummaries(data);
  if (term) {
    list = list.filter(
      (p) => p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term) || p.medicalConditions.toLowerCase().includes(term)
    );
  }
  if (filter === 'upcoming') list = list.filter((p) => p.nextAppointment);
  if (filter === 'attention') list = list.filter((p) => p.risk === 'high' || p.risk === 'medium');
  return list.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || a.name.localeCompare(b.name));
}

export async function getPatientDetail(doctorId, patientId) {
  const data = await loadDoctorData(doctorId);
  const summary = buildPatientSummaries(data).find((p) => p.id === patientId);
  // Doctors can only open patients they have an appointment with; anything else looks like "not found"
  if (!summary) throw new AdminError(404, 'Patient not found');

  const own = data.appointments.filter((a) => a.patientId === patientId).sort(byDateTime).reverse();
  const current = summary.vitals;
  const analysis = analyzePatient(current, summary);
  const history = (data.metrics.get(patientId)?.history || []).map(normalizeMetric).slice(0, 10);

  let records;
  let medications;
  if (await isDatabaseConnected()) {
    const sortRecords = (items) => items.sort((a, b) => new Date(b.date || b.startDate) - new Date(a.date || a.startDate));
    records = sortRecords(await mongoose.connection.collection('medical_records').find({ userId: patientId }).toArray());
    medications = sortRecords(await mongoose.connection.collection('medications').find({ userId: patientId }).toArray());
  } else {
    records = getMedicalRecords(patientId);
    medications = getMedications(patientId);
  }

  return {
    patient: summary,
    analysis,
    vitalsHistory: history,
    appointments: own,
    records: records.map((r) => ({
      id: String(r._id),
      title: r.title,
      type: r.type,
      date: r.date,
      doctor: r.doctor,
      findings: r.findings || '',
      status: r.status || '',
      hasFile: !!r.fileUrl,
    })),
    medications: medications.map((m) => ({
      id: String(m._id),
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      startDate: m.startDate,
      endDate: m.endDate || '',
      active: !!m.active,
      prescribedBy: m.prescribedBy || '',
    })),
  };
}

// ---------------------------------------------------------------------------
// Appointments / consultations
// ---------------------------------------------------------------------------

const APPOINTMENT_STATUSES = ['upcoming', 'completed', 'cancelled'];

export async function listAppointments(doctorId, { status = '', search = '', when = '' } = {}) {
  const data = await loadDoctorData(doctorId);
  const today = localDate();
  const term = search.trim().toLowerCase();
  let list = data.appointments.map((a) => {
    const user = data.users.get(a.patientId);
    const patient = normalizePatient(user, a.patientName || 'Unknown patient');
    return { ...a, patientName: patient.name, patientAge: patient.age, patientGender: patient.gender, patientEmail: patient.email, patientExists: !!user };
  });
  list = list.filter((a) => a.patientExists);

  if (status === 'active') list = list.filter((a) => isActiveStatus(a.status));
  else if (status) list = list.filter((a) => a.status === status);
  if (when === 'today') list = list.filter((a) => a.date === today);
  if (when === 'upcoming') list = list.filter((a) => a.date >= today);
  if (when === 'past') list = list.filter((a) => a.date < today);
  if (term) list = list.filter((a) => a.patientName.toLowerCase().includes(term) || a.reason.toLowerCase().includes(term));

  return list.sort(byDateTime);
}

export async function updateDoctorAppointment(doctorId, appointmentId, body = {}) {
  const all = await loadAppointmentsFor(doctorId);
  const existing = all.find((a) => a.id === String(appointmentId));
  // Appointments booked with other doctors are invisible here
  if (!existing) throw new AdminError(404, 'Appointment not found');

  if (existing.status === 'cancelled') throw new AdminError(400, 'A cancelled appointment cannot be changed');

  const updates = {};
  if (body.status !== undefined) {
    if (!APPOINTMENT_STATUSES.includes(body.status)) throw new AdminError(400, 'Status must be upcoming, completed or cancelled');
    if (body.status === 'upcoming' && existing.status !== 'upcoming') throw new AdminError(400, 'A finished appointment cannot be reopened');
    if (body.status === 'completed' && existing.date > localDate()) {
      throw new AdminError(400, 'A future appointment cannot be marked as completed');
    }
    updates.status = body.status;
  }
  for (const [field, max] of [['diagnosis', 500], ['doctorNotes', 2000]]) {
    if (body[field] !== undefined) {
      const value = str(body[field]);
      if (value.length > max) throw new AdminError(400, `${field === 'diagnosis' ? 'Diagnosis' : 'Notes'} must be at most ${max} characters`);
      updates[field] = value;
    }
  }
  if (body.date !== undefined || body.time !== undefined) {
    if (existing.status === 'completed') throw new AdminError(400, 'A completed appointment cannot be rescheduled');
    if (body.date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str(body.date)) || Number.isNaN(new Date(body.date).getTime())) throw new AdminError(400, 'Date is invalid');
      if (str(body.date) < localDate()) throw new AdminError(400, 'The new date cannot be in the past');
      updates.date = str(body.date);
    }
    if (body.time !== undefined) {
      if (!DOCTOR_TIME_SLOTS.includes(str(body.time))) throw new AdminError(400, 'Time is not an available slot');
      updates.time = str(body.time);
    }
    const nextDate = updates.date || existing.date;
    const nextTime = updates.time || existing.time;
    if (all.some((a) => a.id !== existing.id && a.status !== 'cancelled' && a.date === nextDate && a.time === nextTime)) {
      throw new AdminError(409, 'You already have a visit at that date and time');
    }
  }
  if (Object.keys(updates).length === 0) throw new AdminError(400, 'Nothing to update');

  if (await isDatabaseConnected()) {
    const doc = await Appointment.findOneAndUpdate({ _id: existing.id, doctorId }, { $set: { ...updates, updatedAt: new Date() } }, { new: true }).lean();
    return normalizeAppointment(doc);
  }
  return normalizeAppointment(updateStaticAppointment(existing.id, updates));
}

// ---------------------------------------------------------------------------
// Overview, analysis and analytics
// ---------------------------------------------------------------------------

export async function getOverview(doctorId) {
  const data = await loadDoctorData(doctorId);
  const today = localDate();
  const monthPrefix = today.slice(0, 7);
  const patients = buildPatientSummaries(data);
  const visible = data.appointments.filter((a) => data.users.has(a.patientId));
  const named = (a) => {
    const p = patients.find((x) => x.id === a.patientId);
    return { ...a, patientName: p?.name || a.patientName, patientAge: p?.age ?? null, patientGender: p?.gender || '', risk: p?.risk || 'unknown' };
  };
  const active = visible.filter((a) => isActiveStatus(a.status));

  const flagged = patients.filter((p) => p.risk === 'high' || p.risk === 'medium');
  return {
    stats: {
      patients: patients.length,
      today: active.filter((a) => a.date === today).length,
      upcoming: active.filter((a) => a.date >= today).length,
      completedThisMonth: visible.filter((a) => a.status === 'completed' && a.date.startsWith(monthPrefix)).length,
      needAttention: flagged.length,
    },
    today: active.filter((a) => a.date === today).sort(byDateTime).map(named),
    upcoming: active.filter((a) => a.date > today).sort(byDateTime).slice(0, 6).map(named),
    overdue: active.filter((a) => a.date < today).sort(byDateTime).map(named),
    recentPatients: [...patients].sort((a, b) => b.lastActivityDate.localeCompare(a.lastActivityDate)).slice(0, 5),
    attention: flagged.slice(0, 4).map((p) => ({ id: p.id, name: p.name, risk: p.risk, topFlag: p.topFlag })),
  };
}

export async function getAnalysis(doctorId) {
  const data = await loadDoctorData(doctorId);
  const summaries = buildPatientSummaries(data);
  const items = summaries
    .map((p) => {
      const analysis = analyzePatient(p.vitals, p);
      return { patient: { id: p.id, name: p.name, age: p.age, gender: p.gender, nextAppointment: p.nextAppointment }, risk: analysis.risk, flags: analysis.flags, vitals: p.vitals };
    })
    .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || a.patient.name.localeCompare(b.patient.name));

  const counts = { high: 0, medium: 0, low: 0, none: 0, unknown: 0 };
  for (const item of items) counts[item.risk] = (counts[item.risk] || 0) + 1;
  return { generatedAt: new Date().toISOString(), counts, total: items.length, items };
}

export async function getAnalytics(doctorId) {
  const data = await loadDoctorData(doctorId);
  const visible = data.appointments.filter((a) => data.users.has(a.patientId));
  const patients = buildPatientSummaries(data);
  const now = new Date();

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = localDate(d).slice(0, 7);
    months.push({ key, label: d.toLocaleString('en-US', { month: 'short' }), total: 0, completed: 0, cancelled: 0 });
  }
  for (const a of visible) {
    const bucket = months.find((m) => a.date.startsWith(m.key));
    if (!bucket) continue;
    bucket.total++;
    if (a.status === 'completed') bucket.completed++;
    if (a.status === 'cancelled') bucket.cancelled++;
  }

  const byStatus = visible.reduce((acc, a) => ((acc[a.status] = (acc[a.status] || 0) + 1), acc), {});
  const finished = (byStatus.completed || 0) + (byStatus.cancelled || 0);

  const reasons = new Map();
  for (const a of visible) {
    const key = a.reason.trim().toLowerCase();
    if (key) reasons.set(key, (reasons.get(key) || 0) + 1);
  }
  const topReasons = [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([reason, count]) => ({ reason: reason.charAt(0).toUpperCase() + reason.slice(1), count }));

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => ({ label, count: 0 }));
  for (const a of visible) {
    const d = new Date(`${a.date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) weekdays[d.getDay()].count++;
  }

  const gender = patients.reduce((acc, p) => {
    const key = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : 'Not recorded';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const risk = { high: 0, medium: 0, low: 0, none: 0, unknown: 0 };
  for (const p of patients) risk[p.risk]++;

  const firstSeen = new Map();
  for (const a of visible) {
    const seen = firstSeen.get(a.patientId);
    if (!seen || a.date < seen) firstSeen.set(a.patientId, a.date);
  }
  const monthPrefix = localDate().slice(0, 7);

  return {
    totals: {
      patients: patients.length,
      appointments: visible.length,
      completed: byStatus.completed || 0,
      cancelled: byStatus.cancelled || 0,
      upcoming: visible.filter((a) => isActiveStatus(a.status) && a.date >= localDate()).length,
      completionRate: finished ? Math.round(((byStatus.completed || 0) / finished) * 100) : null,
      newPatientsThisMonth: [...firstSeen.values()].filter((d) => d.startsWith(monthPrefix)).length,
    },
    months,
    byStatus,
    topReasons,
    weekdays,
    gender,
    risk,
  };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

const NOTIFICATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getDoctorNotifications(doctorId) {
  const data = await loadDoctorData(doctorId);
  const since = Date.now() - NOTIFICATION_WINDOW_MS;
  const items = [];
  const nameOf = (id, fallback) => {
    const u = data.users.get(id);
    return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : fallback || 'A patient';
  };

  for (const a of data.appointments) {
    if (!data.users.has(a.patientId)) continue;
    const created = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const updated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    if (a.status === 'cancelled' && updated >= since) {
      items.push({
        id: `appt-${a.id}-cancelled`, type: 'appointment', severity: 'warning', title: 'Appointment cancelled',
        text: `${nameOf(a.patientId, a.patientName)}'s appointment on ${a.date} at ${a.time} was cancelled.`,
        createdAt: new Date(updated).toISOString(), href: '/dashboard/doctor/consultations',
      });
    } else if (a.status === 'upcoming' && created >= since) {
      items.push({
        id: `appt-${a.id}-created`, type: 'appointment', severity: 'info', title: 'New appointment booked',
        text: `${nameOf(a.patientId, a.patientName)} booked ${a.date} at ${a.time}${a.reason ? ` for "${a.reason}"` : ''}.`,
        createdAt: new Date(created).toISOString(), href: '/dashboard/doctor/consultations',
      });
    }
  }

  for (const p of buildPatientSummaries(data)) {
    if (p.risk === 'high' && p.topFlag) {
      items.push({
        id: `flag-${p.id}-${p.topFlag.id}`, type: 'alert', severity: 'error', title: `High-priority reading: ${p.name}`,
        text: `${p.topFlag.title} (${p.topFlag.value || 'see details'}).`,
        createdAt: p.vitals?.timestamp || new Date().toISOString(), href: `/dashboard/doctor/patients/${p.id}`,
      });
    }
  }
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
}

// ---------------------------------------------------------------------------
// Own profile
// ---------------------------------------------------------------------------

function toDoctorProfile(user) {
  const experienceYears = parseInt(String(user.experience || '').replace(/\D/g, ''), 10);
  return {
    id: String(user.id || user._id),
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email || '',
    phone: user.phone || '',
    specialty: user.specialty || DOCTOR_SPECIALTIES[0],
    education: user.education || '',
    experienceYears: Number.isFinite(experienceYears) ? experienceYears : '',
    hospital: user.hospital || '',
    location: user.location || DOCTOR_LOCATIONS[0],
    licenseNumber: user.licenseNumber || '',
    bio: user.about || '',
    languages: Array.isArray(user.languages) && user.languages.length ? user.languages : ['English', 'Urdu'],
    consultationFee: user.consultationFee ?? '',
    availableTimeSlots: Array.isArray(user.availableTimeSlots) && user.availableTimeSlots.length ? user.availableTimeSlots : DEFAULT_TIME_SLOTS,
    avatar: user.avatar || '',
    joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
  };
}

async function loadOwnDoctor(doctorId) {
  if (await isDatabaseConnected()) {
    const user = isObjectId(doctorId) ? await User.findById(doctorId).lean() : null;
    if (!user || user.userType !== 'doctor') throw new AdminError(404, 'Doctor not found');
    return { source: 'mongodb', user };
  }
  const user = findStaticUser(doctorId);
  if (!user || user.userType !== 'doctor') throw new AdminError(404, 'Doctor not found');
  return { source: 'static', user };
}

export async function getDoctorProfile(doctorId) {
  return toDoctorProfile((await loadOwnDoctor(doctorId)).user);
}

export async function updateDoctorProfile(doctorId, body = {}) {
  const updates = {};

  if (body.name !== undefined) {
    const name = str(body.name);
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) throw new AdminError(400, 'Full name is required');
    if (name.length > 100) throw new AdminError(400, 'Full name is too long');
    updates.firstName = parts[0];
    updates.lastName = parts.slice(1).join(' ');
  }
  if (body.phone !== undefined) {
    const phone = str(body.phone);
    if (phone && !/^[+\d][\d\s()-]{5,19}$/.test(phone)) throw new AdminError(400, 'Phone number is invalid');
    updates.phone = phone;
  }
  if (body.specialty !== undefined) {
    if (!DOCTOR_SPECIALTIES.includes(body.specialty)) throw new AdminError(400, 'Specialty is not a valid option');
    updates.specialty = body.specialty;
  }
  if (body.location !== undefined) {
    if (!DOCTOR_LOCATIONS.includes(body.location)) throw new AdminError(400, 'Location is not a valid option');
    updates.location = body.location;
  }
  if (body.education !== undefined) {
    const education = str(body.education);
    if (education.length > 200) throw new AdminError(400, 'Qualifications must be at most 200 characters');
    updates.education = education;
  }
  if (body.experienceYears !== undefined && body.experienceYears !== '') {
    const years = Number(body.experienceYears);
    if (!Number.isInteger(years) || years < 0 || years > 60) throw new AdminError(400, 'Experience must be a whole number of years between 0 and 60');
    updates.experience = `${years} years`;
  }
  if (body.hospital !== undefined) {
    const hospital = str(body.hospital);
    if (hospital.length > 120) throw new AdminError(400, 'Hospital affiliation is too long');
    updates.hospital = hospital;
  }
  if (body.licenseNumber !== undefined) {
    const license = str(body.licenseNumber);
    if (license && !/^[A-Za-z0-9\-/ ]{3,30}$/.test(license)) throw new AdminError(400, 'License number may only contain letters, numbers, dashes and slashes');
    updates.licenseNumber = license;
  }
  if (body.bio !== undefined) {
    const bio = str(body.bio);
    if (bio.length > 600) throw new AdminError(400, 'Bio must be at most 600 characters');
    updates.about = bio;
  }
  if (body.languages !== undefined) {
    if (!Array.isArray(body.languages) || body.languages.length === 0 || !body.languages.every((l) => DOCTOR_LANGUAGES.includes(l))) {
      throw new AdminError(400, 'Choose at least one language from the list');
    }
    updates.languages = [...new Set(body.languages)];
  }
  if (body.consultationFee !== undefined && body.consultationFee !== '') {
    const fee = Number(body.consultationFee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 100000) throw new AdminError(400, 'Consultation fee must be between 0 and 100000');
    updates.consultationFee = Math.round(fee);
  }
  if (body.availableTimeSlots !== undefined) {
    if (!Array.isArray(body.availableTimeSlots) || body.availableTimeSlots.length === 0 || !body.availableTimeSlots.every((s) => DOCTOR_TIME_SLOTS.includes(s))) {
      throw new AdminError(400, 'Choose at least one available time slot');
    }
    updates.availableTimeSlots = DOCTOR_TIME_SLOTS.filter((s) => body.availableTimeSlots.includes(s));
  }
  if (body.avatar !== undefined) {
    if (body.avatar === '' || body.avatar === null) {
      updates.avatar = '';
    } else if (typeof body.avatar !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(body.avatar)) {
      throw new AdminError(400, 'Profile picture must be a PNG, JPEG or WebP image');
    } else if (body.avatar.length > MAX_AVATAR_LENGTH) {
      throw new AdminError(400, 'Profile picture is too large');
    } else {
      updates.avatar = body.avatar;
    }
  }

  const { source, user } = await loadOwnDoctor(doctorId);
  if (source === 'mongodb') {
    const doc = await User.findById(doctorId);
    Object.assign(doc, updates, { updatedAt: new Date() });
    await doc.save();
    return toDoctorProfile(doc.toObject());
  }
  return toDoctorProfile(updateStaticUser(user.id, updates));
}

// ---------------------------------------------------------------------------
// Reports uploaded by a doctor for one of their patients
// ---------------------------------------------------------------------------

export async function addPatientReport(doctorId, body = {}) {
  const patientId = str(body.patientId);
  const kind = str(body.kind);
  const title = str(body.title);
  const findings = str(body.findings);
  const recommendations = str(body.recommendations);
  const detail = str(body.detail); // modality or test name

  if (!patientId) throw new AdminError(400, 'Choose a patient');
  if (!['imaging', 'lab'].includes(kind)) throw new AdminError(400, 'Report type must be imaging or lab');
  const allowed = kind === 'imaging' ? REPORT_IMAGE_MODALITIES : REPORT_LAB_TESTS;
  if (!allowed.includes(detail)) throw new AdminError(400, kind === 'imaging' ? 'Choose an imaging type' : 'Choose a lab test');
  if (!title) throw new AdminError(400, 'Report title is required');
  if (title.length > 150) throw new AdminError(400, 'Report title is too long');
  if (!findings) throw new AdminError(400, 'Enter the findings or interpretation');
  if (findings.length > 4000 || recommendations.length > 2000) throw new AdminError(400, 'Findings or recommendations are too long');
  const date = str(body.date) || localDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime())) throw new AdminError(400, 'Date is invalid');
  if (date > localDate()) throw new AdminError(400, 'The report date cannot be in the future');

  let fileUrl = '';
  let fileName = '';
  if (body.file) {
    if (typeof body.file !== 'string' || !/^data:(application\/pdf|image\/(png|jpeg));base64,[A-Za-z0-9+/=]+$/.test(body.file)) {
      throw new AdminError(400, 'Attach a PDF, PNG or JPEG file');
    }
    if (body.file.length > MAX_REPORT_FILE_LENGTH) throw new AdminError(400, 'The attached file is too large (2 MB maximum)');
    fileUrl = body.file;
    fileName = str(body.fileName).slice(0, 120);
  }

  // Only the doctor's own patients may receive reports
  const data = await loadDoctorData(doctorId);
  if (!data.patientIds.includes(patientId) || !data.users.has(patientId)) throw new AdminError(404, 'Patient not found');

  const { user: doctorUser } = await loadOwnDoctor(doctorId);
  const record = {
    userId: patientId,
    title,
    type: kind,
    category: detail,
    date,
    doctor: `Dr. ${`${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim()}`,
    doctorId,
    findings: recommendations ? `${findings}\n\nRecommendations: ${recommendations}` : findings,
    fileUrl,
    fileName,
    status: 'reviewed',
    uploadedByDoctor: true,
  };

  if (await isDatabaseConnected()) {
    const now = new Date();
    const result = await mongoose.connection.collection('medical_records').insertOne({ ...record, createdAt: now, updatedAt: now });
    return { id: String(result.insertedId), title, patientId };
  }
  const saved = addMedicalRecord(record);
  return { id: saved._id, title, patientId };
}

export { SEVERITY_ORDER };

// ---------------------------------------------------------------------------
// Bookable slots (used by the patient booking flow)
// ---------------------------------------------------------------------------

// The doctor's offered slots for a date, each marked available or already booked
export async function getBookableSlots(doctorId, date, excludeAppointmentId = '') {
  const { user } = await loadOwnDoctor(doctorId);
  const offered = toDoctorProfile(user).availableTimeSlots;
  const taken = new Set(
    (await loadAppointmentsFor(doctorId)).filter((a) => a.id !== excludeAppointmentId && a.date === date && a.status !== 'cancelled').map((a) => a.time)
  );
  return offered.map((time) => ({ time, available: !taken.has(time) }));
}

// Throws unless the doctor exists, offers `time`, and nobody has booked it on `date`
export async function assertSlotBookable(doctorId, date, time, excludeAppointmentId = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || Number.isNaN(new Date(date).getTime())) throw new AdminError(400, 'Appointment date is invalid');
  if (date < localDate()) throw new AdminError(400, 'Appointment date cannot be in the past');
  const slots = await getBookableSlots(String(doctorId), date, excludeAppointmentId);
  const slot = slots.find((s) => s.time === time);
  if (!slot) throw new AdminError(400, 'That time is not offered by this doctor');
  if (!slot.available) throw new AdminError(409, 'That time slot has just been booked. Please choose another.');
}
