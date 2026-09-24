import bcrypt from 'bcryptjs';
import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import { generateToken } from '../../../lib/jwt';
import { findUserByEmail, hashPassword, createUser } from '../../../lib/static-data';

// Make sure this function is exported as default
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { firstName, lastName, email, password, userType } = req.body || {};

  // Server-side validation mirrors the registration form so the API cannot be used to bypass it
  if ([firstName, lastName, email, password].some((v) => typeof v !== 'string' || !v.trim())) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Email is invalid' });
  }
  if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[\W_]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters and include upper and lower case letters, a number and a special character'
    });
  }

  // Only allow patient registration through this endpoint
  if (userType !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Only patient registration is allowed'
    });
  }

  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password, // Will be hashed by the pre-save hook in the model
      userType
    });

    // Save the user to the database
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      userType: user.userType
    });

    // Return user data (without password) and token
    return res.status(201).json({
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
    console.error('DB registration unavailable, using static fallback:', error.message);

    // Static demo fallback (works without a live MongoDB connection)
    if (findUserByEmail(email)) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const staticUser = createUser({
      firstName,
      lastName,
      email,
      password: await hashPassword(password),
      userType, // 'patient'
    });

    const token = generateToken({
      id: staticUser.id,
      email: staticUser.email,
      userType: staticUser.userType,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: staticUser.id,
        email: staticUser.email,
        name: `${staticUser.firstName} ${staticUser.lastName}`,
        type: staticUser.userType,
        token,
      },
    });
  }
} 