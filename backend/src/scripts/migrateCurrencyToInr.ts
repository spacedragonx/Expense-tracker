import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";
import Expense from "../models/Expense";
import Income from "../models/Income";

/**
 * One-off migration: switches every existing User/Expense/Income document
 * whose `currency` is still "USD" (the old schema default) over to "INR".
 *
 * Only touches documents literally set to "USD" — if you'd already changed
 * a document to some other currency on purpose (EUR, GBP, etc.), this
 * leaves it alone.
 *
 * Run with:
 *   npx ts-node src/scripts/migrateCurrencyToInr.ts
 * (from the backend/ directory, with MONGO_URI set in .env)
 */
async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment (.env)");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const [userResult, expenseResult, incomeResult] = await Promise.all([
    User.updateMany({ currency: "USD" }, { $set: { currency: "INR" } }),
    Expense.updateMany({ currency: "USD" }, { $set: { currency: "INR" } }),
    Income.updateMany({ currency: "USD" }, { $set: { currency: "INR" } }),
  ]);

  console.log(`Users updated:    ${userResult.modifiedCount}`);
  console.log(`Expenses updated: ${expenseResult.modifiedCount}`);
  console.log(`Income updated:   ${incomeResult.modifiedCount}`);

  await mongoose.disconnect();
  console.log("Done.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
