import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { getAuthUser, signToken } from '../../../../lib/jwt';

export async function POST(request) {
  try {
    // The AI Doctor session is tied to the logged-in user, never to a client-supplied ID
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { doctorType } = await request.json();

    // Validate doctor type
    if (!doctorType || (doctorType !== 'personal' && doctorType !== 'general')) {
      return NextResponse.json(
        { message: 'Valid doctor type required (personal or general)' },
        { status: 400 }
      );
    }

    const userId = authUser.id;

    // For personal doctor, ensure user exists in database
    if (doctorType === 'personal') {
      try {
        const { db } = await connectToDatabase();

        // Check if user exists
        let user = await db.collection('users').findOne({ userId });

        // If not, create a new user record
        if (!user) {
          await db.collection('users').insertOne({
            userId,
            healthData: {},
            chatHistory: [],
            createdAt: new Date()
          });
        }
      } catch (dbError) {
        console.error('Database error:', dbError.message);
        // Continue even with database error, as we can still provide a stateless experience
      }
    }

    // Create JWT token with doctor type information (1 hour expiration)
    const token = signToken({ userId, doctorType }, { expiresIn: '1h' });

    return NextResponse.json({ token, doctorType });
  } catch (error) {
    console.error('Session initialization error:', error.message);
    return NextResponse.json(
      { message: 'Error initializing doctor session' },
      { status: 500 }
    );
  }
}
