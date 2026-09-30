import { NextResponse } from 'next/server';
import { tryConnectToDatabase } from '../../../../lib/mongodb';
import { addMedicalRecord } from '../../../../lib/static-data';
import { getAuthUser } from '../../../../lib/jwt';

export async function POST(request) {
  try {
    // Verify the login token; records always belong to the authenticated user
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: missing or invalid token' },
        { status: 401 }
      );
    }

    const userId = authUser.id;
    
    // Parse request body
    const body = await request.json();
    const { title, type, date, doctor, findings, fileUrl, status } = body;
    
    // Validate required fields
    if (!title || !type || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, and date are required' },
        { status: 400 }
      );
    }
    
    // Connect to the database (static fallback when MongoDB is unavailable)
    const conn = await tryConnectToDatabase();
    
    // Create record object
    const record = {
      userId,
      title,
      type,
      date,
      doctor: doctor || 'Not specified',
      findings: findings || '',
      fileUrl: fileUrl || '',
      status: status || 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (!conn) {
      const { createdAt, updatedAt, ...fields } = record;
      const saved = addMedicalRecord(fields);
      return NextResponse.json({
        success: true,
        fallback: true,
        message: 'Medical record uploaded successfully',
        recordId: saved._id
      });
    }
    const { db } = conn;

    // Insert the record into the database
    const result = await db.collection('medical_records').insertOne(record);
    
    if (!result.acknowledged) {
      return NextResponse.json(
        { error: 'Failed to save medical record' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Medical record uploaded successfully',
      recordId: result.insertedId
    });
    
  } catch (error) {
    console.error('Error uploading medical record:', error);
    return NextResponse.json(
      { error: 'Failed to upload medical record' },
      { status: 500 }
    );
  }
}