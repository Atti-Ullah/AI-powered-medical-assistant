// Seeds dummy users, appointments, vitals, records and medications through the running app's own APIs.
//
//   node scripts/seed-demo-data.mjs            (app on http://localhost:3000)
//   BASE_URL=http://localhost:3001 node scripts/seed-demo-data.mjs
//
// Every seeded account uses the password below. Re-running skips accounts that already exist, and
// activity (bookings, vitals, records) is only created for newly created patients.
//
// The demo doctor Dr. Sarah Johnson (dr.sarah@medisynix.com) receives most bookings so the doctor
// dashboard has today's visits, upcoming visits, completed visits, an overdue one, a cancellation
// and patients with a range of vitals (from normal to a hypertensive-crisis reading).
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN = { email: 'admin@medisynix.com', password: process.env.ADMIN_PASSWORD || 'admin123' };
const DEMO_DOCTOR = { email: 'dr.sarah@medisynix.com', password: process.env.DOCTOR_PASSWORD || 'doctor123' };
export const DEMO_PASSWORD = 'Demo@1234';

// [first, last, gender, dateOfBirth, conditions, allergies, bloodType, vitals | null]
const PATIENTS = [
  ['Ayesha', 'Khan', 'female', '1988-04-12', 'Hypertension', 'Penicillin', 'B+', { bp: '152/96', hr: 88, glucose: 105, h: 162, w: 78 }],
  ['Bilal', 'Ahmed', 'male', '1979-09-03', 'Type 2 diabetes', '', 'O+', { bp: '138/88', hr: 92, glucose: 214, h: 175, w: 96 }],
  ['Fatima', 'Zahra', 'female', '1995-01-22', '', 'Peanuts', 'A+', { bp: '118/76', hr: 72, glucose: 92, h: 165, w: 58 }],
  ['Hamza', 'Malik', 'male', '1969-11-30', 'Asthma', '', 'AB+', { bp: '128/82', hr: 104, glucose: 98, h: 178, w: 84 }],
  ['Iqra', 'Siddiqui', 'female', '2001-06-18', 'Migraine', '', 'O-', { bp: '96/58', hr: 66, glucose: 88, h: 168, w: 49 }],
  ['Junaid', 'Raza', 'male', '1985-02-09', '', '', 'A-', null],
  ['Kiran', 'Butt', 'female', '1992-08-27', 'Hypothyroidism', '', 'B-', { bp: '124/80', hr: 74, glucose: 132, h: 160, w: 82 }],
  ['Usman', 'Farooq', 'male', '1958-12-05', 'Coronary artery disease', 'Aspirin', 'O+', { bp: '186/122', hr: 125, glucose: 180, h: 172, w: 91 }],
];
const DOCTORS = [
  ['Imran', 'Qureshi', 'Pediatrician', '9 years', 'MBBS, FCPS'],
  ['Sadia', 'Noor', 'Gynecologist', '11 years', 'MBBS, FCPS'],
  ['Tariq', 'Mehmood', 'Orthopedic Surgeon', '14 years', 'MBBS, MS Orthopedics'],
  ['Zainab', 'Hashmi', 'Psychiatrist', '7 years', 'MBBS, MRCPsych'],
];
const ADMINS = [['Support', 'Lead']];
const REASONS = ['Routine check-up', 'Follow-up visit', 'Persistent headache', 'Back pain', 'Skin rash', 'Blood pressure review'];
const DIAGNOSES = ['Essential hypertension, stable', 'Viral upper respiratory infection', 'Tension-type headache', 'Mechanical lower back pain', 'Contact dermatitis', 'Well-controlled on current plan'];
const TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'];

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

const emailFor = (first, last) => `${first}.${last}@demo.medisynix.test`.toLowerCase();
const isoDate = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function main() {
  const login = await api('POST', '/api/auth/login', { body: { ...ADMIN, userType: 'admin' } });
  if (login.status !== 200) throw new Error(`Admin login failed (${login.status}). Set ADMIN_PASSWORD if it was changed.`);
  const adminToken = login.json.data.token;

  const create = async (first, last, userType, extra = {}) => {
    const r = await api('POST', '/api/admin/users', {
      token: adminToken,
      body: { firstName: first, lastName: last, email: emailFor(first, last), password: DEMO_PASSWORD, userType, ...extra },
    });
    if (r.status === 201) return { created: true, id: r.json.data.id };
    if (r.status === 409) return { created: false };
    throw new Error(`Could not create ${first} ${last}: ${r.status} ${JSON.stringify(r.json)}`);
  };

  let created = 0;
  const newPatients = new Set();
  for (const p of PATIENTS) {
    if ((await create(p[0], p[1], 'patient')).created) {
      created++;
      newPatients.add(emailFor(p[0], p[1]));
    }
  }
  for (const [f, l, specialty, experience, education] of DOCTORS) {
    if ((await create(f, l, 'doctor', { specialty, experience, education })).created) created++;
  }
  for (const [f, l] of ADMINS) if ((await create(f, l, 'admin')).created) created++;
  console.log(`Users created: ${created} (existing accounts were skipped)`);

  const directory = (await api('GET', '/api/doctors')).json.data;
  const sarah = directory.find((d) => d.email === DEMO_DOCTOR.email) || directory[0];
  const others = directory.filter((d) => d.id !== sarah.id);
  let appointments = 0, cancelled = 0, records = 0, medications = 0, vitals = 0;
  // The booking API rightly refuses past dates, so earlier visits are collected here and written
  // straight into the local file store afterwards (this seed targets the file-backed demo mode).
  const history = [];

  for (const [index, patient] of PATIENTS.entries()) {
    const [f, l, gender, dob, conditions, allergies, bloodType, v] = patient;
    // Activity is only seeded for newly created patients so re-running never duplicates bookings
    if (!newPatients.has(emailFor(f, l))) continue;
    const session = await api('POST', '/api/auth/login', { body: { email: emailFor(f, l), password: DEMO_PASSWORD, userType: 'patient' } });
    if (session.status !== 200) continue;
    const { token, id } = session.json.data;

    // Profile and vitals (two readings for most patients so the trend has history)
    const profile = { name: `${f} ${l}`, phone: `+92 300 ${1000000 + index * 1111}`, dateOfBirth: dob, gender, bloodType, allergies, medicalConditions: conditions };
    if (v) {
      await api('POST', '/api/patient/update-health-metrics', { token, body: { userId: id, metrics: { height: v.h, weight: v.w + 2, heartRate: v.hr - 4, bloodPressure: '126/82', glucoseLevel: v.glucose - 6 } } });
      Object.assign(profile, { height: v.h, weight: v.w, bloodPressure: v.bp, heartRate: v.hr, glucoseLevel: v.glucose });
      vitals++;
    }
    await api('POST', '/api/patient/update-profile', { token, body: profile });

    // Bookings: [dayOffset, status, doctor]
    const mine = index < 6 ? sarah : others[index % others.length];
    const plan = [[-6 - index, 'upcoming', mine], [index < 3 ? 0 : 2 + index, 'upcoming', mine]];
    if (index === 1) plan.push([-2, 'upcoming', sarah]); // left open on purpose: shows as overdue
    if (index === 3 || index === 6) plan.push([5 + index, 'upcoming', sarah]); // these get cancelled
    for (const [n, [day, status, doctor]] of plan.entries()) {
      const overdue = index === 1 && day === -2;
      if (day < 0) {
        history.push({
          id: `appointment-${Date.now()}-${index}${n}`, patientId: id, patientName: `${f} ${l}`, doctorId: doctor.id,
          doctorName: doctor.name, doctorSpecialty: doctor.specialty, date: isoDate(day), time: TIMES[(index + n) % TIMES.length],
          reason: overdue ? 'Missed follow-up' : REASONS[(index + n) % REASONS.length], status,
          createdAt: new Date(Date.now() + (day - 3) * 86400000).toISOString(),
        });
        continue;
      }
      const r = await api('POST', '/api/patient/appointments', {
        token,
        body: {
          patientId: id, patientName: `${f} ${l}`, doctorId: doctor.id, doctorName: doctor.name,
          doctorSpecialty: doctor.specialty, date: isoDate(day), time: TIMES[(index + n) % TIMES.length],
          reason: overdue ? 'Missed follow-up' : REASONS[(index + n) % REASONS.length], status,
        },
      });
      if (r.status !== 201) {
        console.log(`Skipped a booking for ${f} ${l} on ${isoDate(day)} at ${TIMES[(index + n) % TIMES.length]}: ${r.json?.message || r.status}`);
        continue;
      }
      appointments++;
      if ((index === 3 || index === 6) && n === 2) {
        const c = await api('PUT', '/api/patient/appointments', { token, body: { appointmentId: r.json.data.id, status: 'cancelled' } });
        if (c.status === 200) cancelled++;
      }
    }

    if ((await api('POST', '/api/patient/upload-record', { token, body: { title: 'Blood Test Results', type: 'lab', date: isoDate(-10 - index), doctor: sarah.name, findings: 'Values within normal range' } })).status === 200) records++;
    if ((await api('POST', '/api/patient/medications', { token, body: { name: 'Vitamin D3', dosage: '1000 IU', frequency: 'Once daily', startDate: isoDate(-30), prescribedBy: sarah.name } })).status === 200) medications++;
  }

  if (history.length) {
    const file = path.join(process.cwd(), 'data', 'appointments.json');
    const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    fs.writeFileSync(file, JSON.stringify([...existing, ...history], null, 2));
    appointments += history.length;
  }

  // The doctor completes the past visits (all but the deliberately overdue one) and uploads reports
  let completed = 0, reports = 0;
  if (newPatients.size > 0) {
    const doctorLogin = await api('POST', '/api/auth/login', { body: { ...DEMO_DOCTOR, userType: 'doctor' } });
    if (doctorLogin.status === 200) {
      const dt = doctorLogin.json.data.token;
      const past = (await api('GET', '/api/doctor/appointments?when=past&status=upcoming', { token: dt })).json?.data || [];
      for (const [i, a] of past.entries()) {
        if (a.reason === 'Missed follow-up') continue;
        const r = await api('PUT', `/api/doctor/appointments/${a.id}`, {
          token: dt,
          body: { status: 'completed', diagnosis: DIAGNOSES[i % DIAGNOSES.length], doctorNotes: 'Reviewed history and vitals. Advised lifestyle changes and a follow-up in four weeks.' },
        });
        if (r.status === 200) completed++;
      }
      const mine = (await api('GET', '/api/doctor/patients', { token: dt })).json?.data || [];
      for (const [i, p] of mine.slice(0, 3).entries()) {
        const r = await api('POST', '/api/doctor/reports', {
          token: dt,
          body: i % 2 === 0
            ? { patientId: p.id, kind: 'lab', detail: 'Lipid Profile', title: 'Lipid profile', findings: 'LDL cholesterol mildly raised; other values within range.', recommendations: 'Reduce saturated fat; repeat in three months.', date: isoDate(-3) }
            : { patientId: p.id, kind: 'imaging', detail: 'X-ray (Chest)', title: 'Chest X-ray', findings: 'Lung fields clear. Heart size normal.', date: isoDate(-4) },
        });
        if (r.status === 201) reports++;
      }
    }
  }

  console.log(`Appointments: ${appointments} (${cancelled} cancelled, ${completed} completed by the doctor)`);
  console.log(`Vitals: ${vitals}, records: ${records}, medications: ${medications}, doctor reports: ${reports}`);
  console.log(`Demo password for every seeded account: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
