/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 5000;

/**
 * Connect to the database first, then start listening — avoids serving
 * requests before Mongoose is ready.
 */
const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Expense Tracker API listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
