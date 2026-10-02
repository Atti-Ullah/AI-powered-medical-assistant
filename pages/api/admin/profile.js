import { requireAdmin, sendAdminError, getOwnProfile, updateOwnProfile } from '../../../lib/admin';

export default async function handler(req, res) {
  const authUser = await requireAdmin(req, res);
  if (!authUser) return;

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: await getOwnProfile(authUser.id) });
    }
    if (req.method === 'PUT') {
      return res.status(200).json({ success: true, data: await updateOwnProfile(authUser.id, req.body || {}) });
    }
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
