import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { tryConnectToDatabase } from '../../../../lib/mongodb';
import { getMedications, addMedication, removeMedication } from '../../../../lib/static-data';
import { verifyToken } from '../../../../lib/jwt';
import { inactiveAccountResponse } from '../../../../lib/account';

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const verified = verifyToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    const inactive = await inactiveAccountResponse(verified);
    if (inactive) return inactive;
    
    // Use the user ID from the token if not provided in the query
    const authenticatedUserId = verified.id;
    const requestedUserId = userId || authenticatedUserId;
    
    // Only allow access to own medications unless admin
    if (authenticatedUserId !== requestedUserId && verified.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    if (!requestedUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Connect to database (static fallback when MongoDB is unavailable)
    const conn = await tryConnectToDatabase();
    if (!conn) {
      return NextResponse.json({ medications: getMedications(requestedUserId), fallback: true });
    }
    const { db } = conn;
    
    // Fetch user medications
    const medications = await db
      .collection('medications')
      .find({ userId: requestedUserId })
      .sort({ startDate: -1 }) // Sort by start date descending (newest first)
      .toArray();
    
    // Return the medications, even if it's an empty array
    return NextResponse.json({ medications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medications' },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new medication
export async function POST(request) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const verified = verifyToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    const inactive = await inactiveAccountResponse(verified);
    if (inactive) return inactive;
    
    const userId = verified.id;
    
    // Parse request body
    const medicationData = await request.json();
    
    // Validate required fields
    if (!medicationData.name || !medicationData.dosage || !medicationData.frequency || !medicationData.startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to database (static fallback when MongoDB is unavailable)
    const conn = await tryConnectToDatabase();
    const { db } = conn || {};
    
    // Create new medication object
    const newMedication = {
      userId,
      name: medicationData.name,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      startDate: medicationData.startDate,
      endDate: medicationData.endDate || '',
      instructions: medicationData.instructions || '',
      prescribedBy: medicationData.prescribedBy || '',
      active: !medicationData.endDate || new Date(medicationData.endDate) >= new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!db) {
      const { createdAt, updatedAt, ...fields } = newMedication;
      const saved = addMedication(fields);
      return NextResponse.json({
        success: true,
        fallback: true,
        message: 'Medication added successfully',
        medicationId: saved._id
      });
    }
    
    // Insert the medication into the database
    const result = await db.collection('medications').insertOne(newMedication);
    
    if (!result.acknowledged) {
      return NextResponse.json(
        { error: 'Failed to save medication' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Medication added successfully',
      medicationId: result.insertedId
    });
  } catch (error) {
    console.error('Error adding medication:', error);
    return NextResponse.json(
      { error: 'Failed to add medication' },
      { status: 500 }
    );
  }
}

// DELETE endpoint: remove one of the signed-in patient's medications (?id=...)
export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const verified = verifyToken(token);
    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const inactive = await inactiveAccountResponse(verified);
    if (inactive) return inactive;

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Medication id is required' }, { status: 400 });
    }

    const conn = await tryConnectToDatabase();
    if (!conn) {
      const removed = removeMedication(verified.id, id);
      if (!removed) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
      return NextResponse.json({ success: true, fallback: true });
    }

    // Stored ids are ObjectIds in MongoDB; also accept string ids
    const filters = [{ _id: id, userId: verified.id }];
    if (ObjectId.isValid(id)) filters.push({ _id: new ObjectId(id), userId: verified.id });
    const result = await conn.db.collection('medications').deleteOne({ $or: filters });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medication:', error);
    return NextResponse.json({ error: 'Failed to delete medication' }, { status: 500 });
  }
}
