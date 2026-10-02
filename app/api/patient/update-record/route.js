import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { tryConnectToDatabase } from '../../../../lib/mongodb';
import { findMedicalRecord, updateMedicalRecord } from '../../../../lib/static-data';
import { getAuthUser } from '../../../../lib/jwt';
import { inactiveAccountResponse } from '../../../../lib/account';

export async function PUT(request) {
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
    
    // Parse the request body
    const { recordId, updatedData } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    if (!updatedData || Object.keys(updatedData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
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
          { error: 'You do not have permission to update this record' },
          { status: 403 }
        );
      }
      const { _id, userId: _owner, createdAt, ...changes } = updatedData;
      const record = updateMedicalRecord(existing._id, changes);
      return NextResponse.json({
        success: true,
        fallback: true,
        message: 'Record updated successfully',
        record
      });
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
        { error: 'You do not have permission to update this record' },
        { status: 403 }
      );
    }
    
    // Prevent updating immutable fields
    const safeUpdate = { ...updatedData };
    delete safeUpdate._id;
    delete safeUpdate.userId;
    delete safeUpdate.createdAt;
    
    // Add updated timestamp
    safeUpdate.updatedAt = new Date();
    
    // Update the record
    const result = await db.collection('medical_records').updateOne(
      { _id: objectId },
      { $set: safeUpdate }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes were made to the record' },
        { status: 304 }
      );
    }
    
    // Fetch the updated record
    const updatedRecord = await db.collection('medical_records').findOne({
      _id: objectId
    });
    
    return NextResponse.json({
      success: true,
      message: 'Record updated successfully',
      record: updatedRecord
    });
    
  } catch (error) {
    console.error('Error updating medical record:', error);
    return NextResponse.json(
      { error: 'Failed to update medical record' },
      { status: 500 }
    );
  }
} 