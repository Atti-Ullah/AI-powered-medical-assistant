import { sendAdminError } from '../../../lib/admin';
import { requireDoctor, addPatientReport } from '../../../lib/doctor';

// Reports carry an optional attached file (up to ~2 MB), so allow a larger body than the default
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const doctor = requireDoctor(req, res);
  if (!doctor) return;
  try {
    return res.status(201).json({ success: true, data: await addPatientReport(doctor.id, req.body || {}) });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
