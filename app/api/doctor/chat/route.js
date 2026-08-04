// import { NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET;

// export async function POST(request) {
//   try {
//     if (!JWT_SECRET) {
//       return NextResponse.json({ message: 'Server not configured' }, { status: 503 });
//     }

//     const authHeader = request.headers.get('Authorization');
//     if (!authHeader?.startsWith('Bearer ')) {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const token = authHeader.split(' ')[1];
//     let decoded;
//     try {
//       decoded = jwt.verify(token, JWT_SECRET);
//     } catch {
//       return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
//     }

//     const { message: userMessage } = await request.json();
//     if (!userMessage) {
//       return NextResponse.json({ message: 'Message required' }, { status: 400 });
//     }

//     // Chatbase iframe handles chat on frontend — this API is kept for compatibility
//     return NextResponse.json({
//       message: 'This endpoint is deprecated. The AI Doctor now uses Chatbase embed.',
//     });

//   } catch (error) {
//     console.error('Chat API Error:', error);
//     return NextResponse.json({ message: 'Server error' }, { status: 500 });
//   }
// }