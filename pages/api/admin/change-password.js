import { requireAdmin, sendAdminError, changeOwnPassword } from '../../../lib/admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  const authUser = await requireAdmin(req, res);
  if (!authUser) return;

  try {
    const { currentPassword, newPassword } = req.body || {};
    await changeOwnPassword(authUser.id, currentPassword, newPassword);
    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
