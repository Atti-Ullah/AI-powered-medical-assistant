import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { tryConnectToDatabase } from '../../../../lib/mongodb';
import { getMedicalRecords } from '../../../../lib/static-data';
import { getAuthUser } from '../../../../lib/jwt';
import { inactiveAccountResponse } from '../../../../lib/account';

// GET endpoint to fetch a user's medical records
export async function GET(request) {
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
    
    // Connect to the database (static fallback when MongoDB is unavailable)
    const conn = await tryConnectToDatabase();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const recordType = searchParams.get('type') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const skip = (page - 1) * limit;
    
    if (!conn) {
      const term = searchTerm.slice(0, 100).toLowerCase();
      const all = getMedicalRecords(userId).filter((rec) =>
        (!recordType || rec.type === recordType) &&
        (!term ||
          [rec.title, rec.doctor, rec.findings].some((v) => (v || '').toLowerCase().includes(term)))
      );
      const totalPages = Math.ceil(all.length / limit);
      return NextResponse.json({
        records: all.slice(skip, skip + limit),
        fallback: true,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: all.length,
          hasMore: page < totalPages
        }
      });
    }
    const { db } = conn;

    // Build the query
    const query = { userId: userId };
    
    // Add search term if provided
    if (searchTerm) {
      // Escape regex metacharacters so user input is matched literally
      const safeTerm = searchTerm.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safeTerm, $options: 'i' } },
        { doctor: { $regex: safeTerm, $options: 'i' } },
        { findings: { $regex: safeTerm, $options: 'i' } }
      ];
    }
    
    // Add record type filter if provided
    if (recordType) {
      query.type = recordType;
    }

    // Fetch records with pagination
    const records = await db
      .collection('medical_records')
      .find(query)
      .sort({ date: -1 }) // Sort by date descending (newest first)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const totalRecords = await db
      .collection('medical_records')
      .countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / limit);
    
    return NextResponse.json({
      records,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasMore: page < totalPages
      }
    });
    
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
} 