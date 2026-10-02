import { sendAdminError } from '../../../lib/admin';
import { requireDoctor, getDoctorProfile, updateDoctorProfile } from '../../../lib/doctor';

export default async function handler(req, res) {
  const doctor = await requireDoctor(req, res);
  if (!doctor) return;
  try {
    if (req.method === 'GET') return res.status(200).json({ success: true, data: await getDoctorProfile(doctor.id) });
    if (req.method === 'PUT') return res.status(200).json({ success: true, data: await updateDoctorProfile(doctor.id, req.body || {}) });
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
