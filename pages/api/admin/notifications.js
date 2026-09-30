import { requireAdmin, sendAdminError, getNotifications } from '../../../lib/admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const data = await getNotifications();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
