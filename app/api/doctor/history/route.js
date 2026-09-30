import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { getBearerToken, verifyToken as verifyJwt } from '../../../../lib/jwt';

// Helper function to verify JWT token
const verifyToken = (request) => {
  const decoded = verifyJwt(getBearerToken(request));
  // Only AI Doctor session tokens (issued by /api/doctor/init) are accepted here
  return decoded && decoded.doctorType && decoded.userId ? decoded : null;
};

export async function DELETE(request) {
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
    
    // Clear chat history in database
    const { db } = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { userId: user.userId },
      { $set: { chatHistory: [] } }
    );
    
    return NextResponse.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear history error:', error);
    return NextResponse.json(
      { message: 'Error clearing chat history' },
      { status: 500 }
    );
  }
} 