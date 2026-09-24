import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import Appointment from '../../../models/Appointment';
import { getDashboardStats, getRecentUsers } from '../../../lib/static-data';
import { getAuthUser } from '../../../lib/jwt';

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Platform statistics and the recent-user list are for administrators only
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (authUser.type !== 'admin') {
    return res.status(403).json({ success: false, message: 'Administrator access required' });
  }

  try {
    await dbConnect();

    // Get counts from database
    const totalUsers = await User.countDocuments();
    const activeDoctors = await User.countDocuments({ userType: 'doctor' });
    const activePatients = await User.countDocuments({ userType: 'patient' });
    const consultations = await Appointment.countDocuments({ status: { $ne: 'cancelled' } });

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .then(users => users.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        type: user.userType,
        status: 'active',
        date: new Date(user.createdAt).toISOString().split('T')[0]
      })));

    // Return the data
    return res.status(200).json({
      success: true,
      totalUsers,
      activeDoctors,
      activePatients,
      consultations,
      recentUsers
    });
  } catch (error) {
    console.error('Error getting dashboard stats from DB:', error.message);

    // Fallback: serve aggregate stats from the static demo dataset so the
    // admin dashboard remains functional without a live database connection.
    const stats = getDashboardStats();
    // getRecentUsers() already returns { id, name, email, type, status, date }
    const recentUsers = getRecentUsers(5);

    return res.status(200).json({
      success: true,
      fallback: true,
      totalUsers: stats.totalUsers,
      activeDoctors: stats.activeDoctors,
      activePatients: stats.activePatients,
      consultations: stats.consultations ?? 0,
      recentUsers,
    });
  }
} 