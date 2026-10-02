import { requireAdmin, sendAdminError, getSystemStatus } from '../../../lib/admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  if (!(await requireAdmin(req, res))) return;

  try {
    return res.status(200).json({ success: true, data: await getSystemStatus() });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
