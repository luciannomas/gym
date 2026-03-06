import mongoose from "mongoose";
import { USE_MEMORY_DB } from "@/lib/inMemoryDB";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/gymapp";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectDB() {
  if (USE_MEMORY_DB) return; // modo memoria, sin conexión real

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
