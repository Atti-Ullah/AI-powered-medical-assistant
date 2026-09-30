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

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Fail fast when the database is down so API routes can use their static fallback
      serverSelectionTimeoutMS: 3000,
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
