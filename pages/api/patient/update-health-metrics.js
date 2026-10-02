import dbConnect from '../../../lib/db';
import HealthMetric from '../../../models/HealthMetric';
import User from '../../../models/User';
import { updateUserHealthMetrics, findUserById } from '../../../lib/static-data';
import { rejectInactiveAccount } from '../../../lib/account';
import { getAuthUser, canAccessUser } from '../../../lib/jwt';

// Plausible human ranges; rejects negative, absurd or non-numeric readings before they are stored
const RANGES = {
  height: [50, 260, 'Height must be between 50 and 260 cm'],
  weight: [2, 500, 'Weight must be between 2 and 500 kg'],
  heartRate: [20, 250, 'Heart rate must be between 20 and 250 bpm'],
  glucoseLevel: [20, 900, 'Glucose must be between 20 and 900 mg/dL'],
  bmi: [5, 100, 'BMI must be between 5 and 100'],
};

function validateMetrics(metrics) {
  for (const [field, [min, max, message]] of Object.entries(RANGES)) {
    if (metrics[field] === undefined || metrics[field] === '') continue;
    const value = Number(metrics[field]);
    if (!Number.isFinite(value) || value < min || value > max) return message;
  }
  if (metrics.bloodPressure !== undefined && metrics.bloodPressure !== '') {
    const match = /^(\d{2,3})\/(\d{2,3})$/.exec(String(metrics.bloodPressure).trim());
    const systolic = match ? Number(match[1]) : 0;
    const diastolic = match ? Number(match[2]) : 0;
    if (!match || systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200 || systolic <= diastolic) {
      return 'Blood pressure must look like 120/80 with a realistic systolic and diastolic value';
    }
  }
  if (metrics.bmiStatus !== undefined && String(metrics.bmiStatus).length > 40) return 'BMI status is too long';
  return '';
}

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, metrics } = req.body || {};
  let safeMetrics = {};

  try {
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!canAccessUser(authUser, userId)) {
      return res.status(403).json({ success: false, message: 'Not allowed to update these health metrics' });
    }
    if (await rejectInactiveAccount(res, authUser)) return;

    // Only accept known metric fields; userId and timestamp are set by the server
    const allowed = ['height', 'weight', 'bloodPressure', 'heartRate', 'glucoseLevel', 'bmi', 'bmiStatus'];
    safeMetrics = Object.fromEntries(
      Object.entries(metrics || {}).filter(([k, v]) => allowed.includes(k) && (typeof v === 'number' || typeof v === 'string'))
    );

    const invalid = validateMetrics(safeMetrics);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    await dbConnect();

    // Verify user exists
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Create a new health metric record
    const healthMetric = new HealthMetric({
      userId,
      ...safeMetrics,
      timestamp: new Date()
    });
    
    // Save to the database
    await healthMetric.save();
    
    // Get latest metrics for this user
    const latestMetrics = await HealthMetric.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
    
    // Return the new metrics and history
    return res.status(200).json({
      success: true,
      data: {
        current: healthMetric,
        history: latestMetrics
      }
    });
  } catch (error) {
    console.error('DB health metrics update unavailable, using static fallback:', error.message);

    // Static demo fallback (works without a live MongoDB connection)
    if (!findUserById(String(userId))) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const stored = updateUserHealthMetrics(String(userId), safeMetrics);
    return res.status(200).json({
      success: true,
      fallback: true,
      data: {
        current: stored.current,
        history: [...stored.history].reverse().slice(0, 10)
      }
    });
  }
} 