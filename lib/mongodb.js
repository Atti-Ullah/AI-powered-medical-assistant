import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/medisynix";
const MONGODB_DB = process.env.MONGODB_DB || "medisynix";

// Check if MongoClient is correctly initialized
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Create cached connection
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

// Skip MongoDB for a short while after a failed attempt so requests fall back to the file store
// immediately instead of each waiting out the connection timeout. Retries automatically.
const RETRY_AFTER_MS = 30000;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }
  if (global.mongoDownUntil && Date.now() < global.mongoDownUntil) {
    throw new Error("MongoDB is unavailable (retrying shortly)");
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Fail fast when the database is down so API routes can use their static fallback
      serverSelectionTimeoutMS: 2000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts).then((client) => {
      return {
        client,
        db: client.db(MONGODB_DB),
      };
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Do not cache a failed attempt, otherwise the app never reconnects once MongoDB is back
    cached.promise = null;
    global.mongoDownUntil = Date.now() + RETRY_AFTER_MS;
    throw error;
  }
  return cached.conn;
}

// Like connectToDatabase, but resolves to null when the database is unreachable
export async function tryConnectToDatabase() {
  try {
    return await connectToDatabase();
  } catch (error) {
    console.error("MongoDB unavailable, using static fallback:", error.message);
    return null;
  }
}
