import { sendAdminError } from '../../../../lib/admin';
import { requireDoctor, listPatients } from '../../../../lib/doctor';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const doctor = requireDoctor(req, res);
  if (!doctor) return;
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const filter = typeof req.query.filter === 'string' ? req.query.filter : '';
    const data = await listPatients(doctor.id, { search, filter });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
