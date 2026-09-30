import { sendAdminError } from '../../../../lib/admin';
import { requireDoctor, updateDoctorAppointment } from '../../../../lib/doctor';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const doctor = requireDoctor(req, res);
  if (!doctor) return;
  try {
    return res.status(200).json({ success: true, data: await updateDoctorAppointment(doctor.id, String(req.query.id), req.body || {}) });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
