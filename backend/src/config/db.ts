import mongoose from "mongoose";

/**
 * Connects to MongoDB (Atlas or local) using MONGO_URI from environment.
 * Fails fast on startup if the connection cannot be established, since
 * every route in this API depends on the database being available.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment (.env)");
  }

  mongoose.set("strictQuery", true);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
};

export default connectDB;
