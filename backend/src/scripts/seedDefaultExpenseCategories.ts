import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category";

/**
 * Seeds the system default expense categories (user: null, isDefault: true)
 * so every account sees them in the expense category dropdown without having
 * to create them manually.
 *
 * Duplicate-safe: matches on { user: null, name, kind: "expense" } and
 * upserts, so re-running this is a no-op for categories that already exist
 * (their icon/color are simply kept in sync with the list below) and only
 * inserts the ones that are missing.
 *
 * Run with:
 *   npm run seed:expense-categories
 * (from the backend/ directory, with MONGO_URI set in .env)
 */
const DEFAULT_EXPENSE_CATEGORIES: { name: string; icon: string; color: string }[] = [
  // Colours come from AUTO_CATEGORY_PALETTE (colour-blind-tested). Auto-created
  // categories skip colours already used here, so they start out distinct from these.
  { name: "Housing", icon: "home", color: "#0072b2" }, // blue
  { name: "Transportation", icon: "car", color: "#e69f00" }, // orange
  { name: "Food & Dining", icon: "utensils", color: "#d55e00" }, // vermillion
  { name: "Utilities", icon: "zap", color: "#56b4e9" }, // sky blue
  { name: "Healthcare", icon: "heart-pulse", color: "#009e73" }, // bluish green
  { name: "Lifestyle & Entertainment", icon: "popcorn", color: "#cc79a7" }, // reddish purple
  { name: "Debt & Obligations", icon: "landmark", color: "#d6153e" }, // crimson
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment (.env)");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  let created = 0;
  let alreadyExisted = 0;

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    // findOneAndUpdate with upsert returns the PRE-update doc by default
    // (null if it didn't exist yet), so this tells us whether we just
    // inserted a new category or only refreshed an existing one.
    const existingBeforeUpdate = await Category.findOneAndUpdate(
      { user: null, name: cat.name, kind: "expense" },
      { $set: { icon: cat.icon, color: cat.color, isDefault: true } },
      { upsert: true, new: false }
    );

    if (existingBeforeUpdate) {
      alreadyExisted++;
      console.log(`  = ${cat.name} (already existed, icon/color refreshed)`);
    } else {
      created++;
      console.log(`  + ${cat.name} (created)`);
    }
  }

  console.log(`\nCreated: ${created}`);
  console.log(`Already existed: ${alreadyExisted}`);

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
