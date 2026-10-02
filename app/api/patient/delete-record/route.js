import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { tryConnectToDatabase } from '../../../../lib/mongodb';
import { findMedicalRecord, deleteMedicalRecord } from '../../../../lib/static-data';
import { getAuthUser } from '../../../../lib/jwt';
import { inactiveAccountResponse } from '../../../../lib/account';

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
    const inactive = await inactiveAccountResponse(authUser);
    if (inactive) return inactive;

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
    
    // Connect to the database (static fallback when MongoDB is unavailable)
    const conn = await tryConnectToDatabase();
    if (!conn) {
      const existing = findMedicalRecord(String(recordId));
      if (!existing) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      if (existing.userId !== userId) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this record' },
          { status: 403 }
        );
      }
      deleteMedicalRecord(existing._id);
      return NextResponse.json({ success: true, fallback: true, message: 'Record deleted successfully' });
    }
    const { db } = conn;
    
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