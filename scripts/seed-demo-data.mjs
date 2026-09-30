// Seeds dummy users, appointments, records and medications through the running app's own APIs.
//
//   node scripts/seed-demo-data.mjs            (app on http://localhost:3000)
//   BASE_URL=http://localhost:3001 node scripts/seed-demo-data.mjs
//
// Every seeded account uses the password below. Re-running skips accounts that already exist.
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN = { email: 'admin@medisynix.com', password: process.env.ADMIN_PASSWORD || 'admin123' };
export const DEMO_PASSWORD = 'Demo@1234';

const PATIENTS = [
  ['Ayesha', 'Khan'], ['Bilal', 'Ahmed'], ['Fatima', 'Zahra'], ['Hamza', 'Malik'],
  ['Iqra', 'Siddiqui'], ['Junaid', 'Raza'], ['Kiran', 'Butt'], ['Usman', 'Farooq'],
];
const DOCTORS = [
  ['Imran', 'Qureshi', 'Pediatrician', '9 years', 'MBBS, FCPS'],
  ['Sadia', 'Noor', 'Gynecologist', '11 years', 'MBBS, FCPS'],
  ['Tariq', 'Mehmood', 'Orthopedic Surgeon', '14 years', 'MBBS, MS Orthopedics'],
  ['Zainab', 'Hashmi', 'Psychiatrist', '7 years', 'MBBS, MRCPsych'],
];
const ADMINS = [['Support', 'Lead']];
const REASONS = ['Routine check-up', 'Follow-up visit', 'Persistent headache', 'Back pain', 'Skin rash', 'Blood pressure review'];

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
const isoDate = (offsetDays) => new Date(Date.now() + offsetDays * 86400000).toISOString().split('T')[0];

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
  for (const [f, l] of PATIENTS) {
    if ((await create(f, l, 'patient')).created) {
      created++;
      newPatients.add(emailFor(f, l));
    }
  }
  for (const [f, l, specialty, experience, education] of DOCTORS) {
    if ((await create(f, l, 'doctor', { specialty, experience, education })).created) created++;
  }
  for (const [f, l] of ADMINS) if ((await create(f, l, 'admin')).created) created++;
  console.log(`Users created: ${created} (existing accounts were skipped)`);

  const directory = (await api('GET', '/api/doctors')).json.data;
  let appointments = 0, cancelled = 0, records = 0, medications = 0;

  for (const [index, [f, l]] of PATIENTS.entries()) {
    // Activity is only seeded for newly created patients so re-running never duplicates bookings
    if (!newPatients.has(emailFor(f, l))) continue;
    const session = await api('POST', '/api/auth/login', { body: { email: emailFor(f, l), password: DEMO_PASSWORD, userType: 'patient' } });
    if (session.status !== 200) continue;
    const { token, id } = session.json.data;

    // One upcoming booking each, a past one for some, and a cancellation for every third patient
    const bookings = [{ day: 3 + index, status: 'upcoming' }];
    if (index % 2 === 0) bookings.push({ day: -5 - index, status: 'completed' });
    for (const [n, b] of bookings.entries()) {
      const doctor = directory[(index + n) % directory.length];
      const r = await api('POST', '/api/patient/appointments', {
        token,
        body: {
          patientId: id, patientName: `${f} ${l}`, doctorId: doctor.id, doctorName: doctor.name,
          doctorSpecialty: doctor.specialty, date: isoDate(b.day), time: ['09:00 AM', '10:00 AM', '02:00 PM'][(index + n) % 3],
          reason: REASONS[(index + n) % REASONS.length], status: b.status,
        },
      });
      if (r.status === 201) {
        appointments++;
        if (index % 3 === 0 && b.status === 'upcoming') {
          const c = await api('PUT', '/api/patient/appointments', { token, body: { appointmentId: r.json.data.id, status: 'cancelled' } });
          if (c.status === 200) cancelled++;
        }
      }
    }

    await api('POST', '/api/patient/update-health-metrics', {
      token,
      body: { userId: id, metrics: { height: 150 + index * 4, weight: 55 + index * 3, heartRate: 68 + index, bloodPressure: '118/76', glucoseLevel: 90 + index } },
    });
    if ((await api('POST', '/api/patient/upload-record', { token, body: { title: 'Blood Test Results', type: 'lab', date: isoDate(-10 - index), doctor: directory[0].name, findings: 'Values within normal range' } })).status === 200) records++;
    if ((await api('POST', '/api/patient/medications', { token, body: { name: 'Vitamin D3', dosage: '1000 IU', frequency: 'Once daily', startDate: isoDate(-30), prescribedBy: directory[1].name } })).status === 200) medications++;
  }

  console.log(`Appointments: ${appointments} (${cancelled} cancelled), records: ${records}, medications: ${medications}`);
  console.log(`Demo password for every seeded account: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
