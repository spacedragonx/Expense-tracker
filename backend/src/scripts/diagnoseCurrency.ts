import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";
import Expense from "../models/Expense";
import Income from "../models/Income";

/**
 * Read-only diagnostic: prints exactly what's stored in the `currency`
 * field across Users/Expenses/Income right now, grouped by value + count.
 * Doesn't change anything — run this first when currency display looks
 * wrong, instead of guessing whether a migration ran.
 *
 * Run with:
 *   npm run diagnose:currency
 * (from the backend/ directory, with MONGO_URI set in .env)
 */
async function diagnose() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment (.env)");
  }

  await mongoose.connect(uri);
  console.log(`Connected to: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const [userBreakdown, expenseBreakdown, incomeBreakdown] = await Promise.all([
    User.aggregate([{ $group: { _id: "$currency", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Expense.aggregate([{ $group: { _id: "$currency", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Income.aggregate([{ $group: { _id: "$currency", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ]);

  const print = (label: string, rows: { _id: string | null; count: number }[]) => {
    console.log(`${label}:`);
    if (rows.length === 0) {
      console.log("  (no documents)");
    } else {
      rows.forEach((r) => console.log(`  ${JSON.stringify(r._id)} : ${r.count}`));
    }
    console.log("");
  };

  print("Users.currency", userBreakdown);
  print("Expenses.currency", expenseBreakdown);
  print("Income.currency", incomeBreakdown);

  // Also print each user individually, since there's usually just a handful
  // and it's the fastest way to spot "my account is still USD".
  const users = await User.find({}, "name email currency").lean();
  console.log("Per-user currency:");
  users.forEach((u) => console.log(`  ${u.email} (${u.name}) -> ${u.currency}`));

  await mongoose.disconnect();
  process.exit(0);
}

diagnose().catch((err) => {
  console.error("Diagnostic failed:", err);
  process.exit(1);
});
