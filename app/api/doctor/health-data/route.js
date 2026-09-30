import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { getBearerToken, verifyToken as verifyJwt } from '../../../../lib/jwt';

// Helper function to verify JWT token
const verifyToken = (request) => {
  const decoded = verifyJwt(getBearerToken(request));
  // Only AI Doctor session tokens (issued by /api/doctor/init) are accepted here
  return decoded && decoded.doctorType && decoded.userId ? decoded : null;
};

export async function GET(request) {
  try {
    // Verify token
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if this is a personal doctor session
    if (user.doctorType !== 'personal') {
      return NextResponse.json(
        { message: 'This endpoint is only for Personal AI Doctor' },
        { status: 403 }
      );
    }
    
    // Get user data from database
    const { db } = await connectToDatabase();
    const userData = await db.collection('users').findOne({ userId: user.userId });
    
    if (!userData) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return health data and chat history
    return NextResponse.json({
      healthData: userData.healthData || {},
      chatHistory: userData.chatHistory || []
    });
  } catch (error) {
    console.error('Health data fetch error:', error);
    return NextResponse.json(
      { message: 'Error fetching health data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify token
    const user = verifyToken(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if this is a personal doctor session
    if (user.doctorType !== 'personal') {
      return NextResponse.json(
        { message: 'This endpoint is only for Personal AI Doctor' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { healthData } = await request.json();
    
    // Validate health data
    if (!healthData) {
      return NextResponse.json(
        { message: 'Health data is required' },
        { status: 400 }
      );
    }
    
    // Update health data in database
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { userId: user.userId },
      { $set: { healthData: healthData } },
      { upsert: true }
    );
    
    return NextResponse.json({ message: 'Health data updated successfully' });
  } catch (error) {
    console.error('Health data update error:', error);
    return NextResponse.json(
      { message: 'Error updating health data' },
      { status: 500 }
    );
  }
} 