import bcrypt from 'bcryptjs';
import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import { generateToken } from '../../../lib/jwt';
import { getStaticFallback } from '../../../lib/auth-fallback';

// Make sure this function is exported as default
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { email, password, userType } = req.body || {};

  // Reject non-string values so request bodies cannot inject MongoDB query operators
  if (typeof email !== 'string' || typeof password !== 'string' || typeof userType !== 'string') {
    return res.status(400).json({ success: false, message: 'Email, password and user type are required' });
  }

  try {
    await dbConnect();

    // Find user by email in database
    const user = await User.findOne({ email });

    // Check if user exists and is of the correct type
    if (!user || user.userType !== userType) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      userType: user.userType
    });

    // Return user data and token
    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        type: user.userType,
        token
      }
    });
  } catch (error) {
    console.error('DB login unavailable, using static fallback:', error.message);

    // Static demo fallback (works without a live MongoDB connection)
    const account = await getStaticFallback(email, password, userType);
    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(account);
    return res.status(200).json({ success: true, data: { ...account, token } });
  }
} 