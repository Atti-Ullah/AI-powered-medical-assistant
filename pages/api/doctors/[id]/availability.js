import { rejectInactiveAccount } from '../../../../lib/account';
import { getAuthUser } from '../../../../lib/jwt';
import { sendAdminError } from '../../../../lib/admin';
import { getBookableSlots, localDate } from '../../../../lib/doctor';

// Which of a doctor's slots are free on a date. Any signed-in user may ask (patients while booking).
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (await rejectInactiveAccount(res, authUser)) return;

  const date = typeof req.query.date === 'string' ? req.query.date : localDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, message: 'Date is invalid' });

  try {
    return res.status(200).json({ success: true, data: { date, slots: await getBookableSlots(String(req.query.id), date, typeof req.query.exclude === 'string' ? req.query.exclude : '') } });
  } catch (error) {
    return sendAdminError(res, error);
  }
}
