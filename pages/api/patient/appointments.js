import dbConnect from '../../../lib/db';
import Appointment from '../../../models/Appointment';
import User from '../../../models/User';
import {
  getUserAppointments,
  createAppointment as createStaticAppointment,
  updateAppointment as updateStaticAppointment,
  getAllAppointments,
} from '../../../lib/static-data';
import { getAuthUser, canAccessUser } from '../../../lib/jwt';

export default async function handler(req, res) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  req.authUser = authUser;

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getAppointments(req, res);
    case 'POST':
      return createNewAppointment(req, res);
    case 'PUT':
      return updateExistingAppointment(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

// Get a user's appointments
async function getAppointments(req, res) {
  const { userId, status } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  if (!canAccessUser(req.authUser, userId)) {
    return res.status(403).json({ success: false, message: 'Not allowed to view these appointments' });
  }

  try {
    await dbConnect();

    // Verify user exists
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Build the query
    const query = { patientId: userId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Get user's appointments
    const appointments = await Appointment.find(query)
      .sort({ date: 1, time: 1 }) // Sort by date and time
      .lean(); // Convert to plain JS objects

    // Return appointments
    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('DB appointments unavailable, using static fallback:', error.message);

    let staticAppointments = getUserAppointments(userId) || [];
    if (status) {
      staticAppointments = staticAppointments.filter((a) => a.status === status);
    }

    return res.status(200).json({
      success: true,
      fallback: true,
      data: staticAppointments,
    });
  }
}

// Create a new appointment
async function createNewAppointment(req, res) {
  const appointmentData = req.body || {};

  if (!appointmentData.patientId) {
    return res.status(400).json({ success: false, message: 'Patient ID is required' });
  }

  if (!canAccessUser(req.authUser, appointmentData.patientId)) {
    return res.status(403).json({ success: false, message: 'Not allowed to book for another patient' });
  }

  try {
    await dbConnect();

    // Verify patient exists
    const patient = await User.findOne({ _id: appointmentData.patientId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Create new appointment
    const appointment = new Appointment({
      ...appointmentData,
      createdAt: new Date()
    });

    // Save to database
    await appointment.save();

    // Return the new appointment
    return res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('DB appointment creation unavailable, using static fallback:', error.message);

    const staticAppointment = createStaticAppointment({
      ...appointmentData,
      id: `appt-${Date.now()}`,
    });

    return res.status(201).json({
      success: true,
      fallback: true,
      data: staticAppointment,
    });
  }
}

// Update an existing appointment
async function updateExistingAppointment(req, res) {
  const { appointmentId, date, time, status, reason, notes } = req.body || {};

  if (!appointmentId) {
    return res.status(400).json({ success: false, message: 'Appointment ID is required' });
  }

  // Only these fields may be changed
  const updatedData = Object.fromEntries(
    Object.entries({ date, time, status, reason, notes }).filter(([, v]) => typeof v === 'string')
  );

  try {
    await dbConnect();

    // Only the owning patient (or an admin) may change an appointment
    const existing = await Appointment.findById(appointmentId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (!canAccessUser(req.authUser, existing.patientId)) {
      return res.status(403).json({ success: false, message: 'Not allowed to change this appointment' });
    }

    updatedData.updatedAt = new Date();

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: updatedData },
      { new: true, runValidators: true } // Return updated document and run schema validators
    );

    if (!updatedAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    console.error('DB appointment update unavailable, using static fallback:', error.message);

    // Static demo fallback (works without a live MongoDB connection)
    const existing = getAllAppointments().find((appt) => appt.id === appointmentId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (!canAccessUser(req.authUser, existing.patientId)) {
      return res.status(403).json({ success: false, message: 'Not allowed to change this appointment' });
    }

    const updated = updateStaticAppointment(appointmentId, updatedData);
    return res.status(200).json({
      success: true,
      fallback: true,
      data: updated,
    });
  }
}
