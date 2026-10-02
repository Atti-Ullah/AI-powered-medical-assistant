import { requireAdmin, sendAdminError, listUsers, createAccount } from '../../../../lib/admin';

export default async function handler(req, res) {
  const authUser = await requireAdmin(req, res);
  if (!authUser) return;

  try {
    if (req.method === 'GET') {
      const search = typeof req.query.search === 'string' ? req.query.search : '';
      const type = typeof req.query.type === 'string' ? req.query.type : '';
      const users = await listUsers({ search, type });
      return res.status(200).json({ success: true, count: users.length, data: users });
    }

    if (req.method === 'POST') {
      const user = await createAccount(req.body);
      return res.status(201).json({ success: true, data: user });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
