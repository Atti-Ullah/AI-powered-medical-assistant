import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { tryConnectToDatabase } from '../../../lib/mongodb';

// Messages sent from the Contact section on the landing page.
// Saved to MongoDB when it is reachable, otherwise to data/contact_messages.json (same pattern as the
// rest of the app's static fallback).

const FILE_PATH = path.join(process.cwd(), 'data', 'contact_messages.json');
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Light in-memory rate limit: 5 messages per hour per address
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function tooManyRequests(key) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function saveToFile(entry) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  let messages = [];
  try {
    messages = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    if (!Array.isArray(messages)) messages = [];
  } catch {
    messages = [];
  }
  messages.push(entry);
  fs.writeFileSync(FILE_PATH, JSON.stringify(messages, null, 2));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }

  const { name, email, subject, message, website } = body || {};

  // Hidden field that real visitors never fill in: quietly accept and discard bot submissions
  if (typeof website === 'string' && website.trim()) {
    return NextResponse.json({ success: true });
  }

  if ([name, email, message].some((v) => typeof v !== 'string' || !v.trim())) {
    return NextResponse.json({ success: false, message: 'Name, email and message are required' }, { status: 400 });
  }
  if (subject !== undefined && typeof subject !== 'string') {
    return NextResponse.json({ success: false, message: 'Invalid subject' }, { status: 400 });
  }

  const entry = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: (subject || '').trim(),
    message: message.trim(),
  };

  if (entry.name.length < 2 || entry.name.length > 100) {
    return NextResponse.json({ success: false, message: 'Please enter your name (2-100 characters)' }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(entry.email) || entry.email.length > 200) {
    return NextResponse.json({ success: false, message: 'Please enter a valid email address' }, { status: 400 });
  }
  if (entry.subject.length > 120) {
    return NextResponse.json({ success: false, message: 'Subject is too long (120 characters max)' }, { status: 400 });
  }
  if (entry.message.length < 10 || entry.message.length > 2000) {
    return NextResponse.json({ success: false, message: 'Message must be 10-2000 characters' }, { status: 400 });
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'local').trim();
  if (tooManyRequests(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many messages. Please try again later.' },
      { status: 429 }
    );
  }

  const record = { ...entry, createdAt: new Date().toISOString(), status: 'new' };

  try {
    const conn = await tryConnectToDatabase();
    if (conn?.db) {
      await conn.db.collection('contact_messages').insertOne({ ...record });
    } else {
      saveToFile({ id: `msg-${Date.now()}`, ...record });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to store contact message:', error.message);
    return NextResponse.json(
      { success: false, message: "We couldn't send your message right now. Please email us directly." },
      { status: 500 }
    );
  }
}
