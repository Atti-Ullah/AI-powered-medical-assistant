import dbConnect from '../../../lib/db';
import HealthMetric from '../../../models/HealthMetric';
import User from '../../../models/User';
import { getUserHealthMetrics } from '../../../lib/static-data';
import { getAuthUser, canAccessUser } from '../../../lib/jwt';

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!canAccessUser(authUser, userId)) {
    return res.status(403).json({ success: false, message: 'Not allowed to view these health metrics' });
  }

  try {
    await dbConnect();

    // Verify user exists
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the most recent health metric
    const currentMetric = await HealthMetric.findOne({ userId })
      .sort({ timestamp: -1 });

    // Get historical metrics
    const history = await HealthMetric.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Return metrics
    return res.status(200).json({
      success: true,
      data: {
        current: currentMetric || null,
        history: history || []
      }
    });
  } catch (error) {
    console.error('DB health metrics unavailable, using static fallback:', error.message);

    // Static demo fallback (works without a live MongoDB connection)
    return res.status(200).json({
      success: true,
      fallback: true,
      data: getUserHealthMetrics(userId) || null
    });
  }
} 