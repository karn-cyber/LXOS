import mongoose from 'mongoose';

// Register every model schema as a side effect of connecting. Mongoose's
// populate() throws MissingSchemaError when a referenced model hasn't been
// registered on the current (serverless) lambda — which happened on Vercel for
// routes/pages that populate a ref without importing that model. Since every
// query path calls dbConnect() first, importing all models here guarantees the
// schemas exist everywhere. Order doesn't matter; models only depend on mongoose.
import '@/models/User';
import '@/models/Club';
import '@/models/Clan';
import '@/models/Room';
import '@/models/Event';
import '@/models/Achievement';
import '@/models/Reimbursement';
import '@/models/Expense';
import '@/models/Approval';
import '@/models/Booking';
import '@/models/File';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection failed:', error.message);
      // Don't cache failed connection attempts
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
