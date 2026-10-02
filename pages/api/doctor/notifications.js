import { sendAdminError } from '../../../lib/admin';
import { requireDoctor, getDoctorNotifications } from '../../../lib/doctor';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const doctor = await requireDoctor(req, res);
  if (!doctor) return;
  try {
    const data = await getDoctorNotifications(doctor.id);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
