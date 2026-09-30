import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { tryConnectToDatabase } from '../../../../lib/mongodb';
import { resetPasswordWithToken } from '../../../../lib/static-data';

export async function POST(request) {
  try {
    // Parse the request body
    const { token, email, password } = await request.json();
    
    // Validate required fields
    if (
      !token || !email || !password ||
      typeof token !== 'string' || typeof email !== 'string' || typeof password !== 'string'
    ) {
      return NextResponse.json({ 
        success: false, 
        message: 'Token, email, and password are required' 
      }, { status: 400 });
    }
    
    // Minimum password length
    if (password.length < 8) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }
    
    // Hash the token from the URL to match stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Connect to MongoDB (static fallback when unavailable)
    const conn = await tryConnectToDatabase();
    if (!conn) {
      const newHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
      if (!resetPasswordWithToken(email, hashedToken, newHash)) {
        return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.'
      });
    }
    const { db } = conn;
    
    // Find user by email and token, and ensure token is not expired
    const user = await db.collection('users').findOne({
      email: email,
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      console.log('Invalid or expired token for reset password');
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired token' 
      }, { status: 400 });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password and clear reset token fields
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: {
          password: hashedPassword
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        }
      }
    );
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return NextResponse.json({
      success: false,
      message: 'An error occurred. Please try again later.'
    }, { status: 500 });
  }
} 