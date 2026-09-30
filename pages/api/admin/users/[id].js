import { requireAdmin, sendAdminError, getUser, updateAccount, deleteAccount } from '../../../../lib/admin';

export default async function handler(req, res) {
  const authUser = requireAdmin(req, res);
  if (!authUser) return;

  const id = String(req.query.id);

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, data: await getUser(id) });
    }

    if (req.method === 'PUT') {
      const user = await updateAccount(id, req.body, authUser);
      return res.status(200).json({ success: true, data: user });
    }

    if (req.method === 'DELETE') {
      await deleteAccount(id, authUser);
      return res.status(200).json({ success: true, message: 'User deleted' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
