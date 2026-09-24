import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../../lib/mongodb';
import { getAuthUser } from '../../../../lib/jwt';

export async function DELETE(request) {
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
    
    // Get the record ID from the query params
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Verify the record exists and belongs to the user
    let objectId;
    try {
      objectId = new ObjectId(recordId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid record ID format' },
        { status: 400 }
      );
    }
    
    const record = await db.collection('medical_records').findOne({
      _id: objectId
    });
    
    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    // Check if the record belongs to the user
    if (record.userId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this record' },
        { status: 403 }
      );
    }
    
    // Delete the record
    const result = await db.collection('medical_records').deleteOne({
      _id: objectId
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete the record' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting medical record:', error);
    return NextResponse.json(
      { error: 'Failed to delete medical record' },
      { status: 500 }
    );
  }
} 