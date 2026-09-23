import "dotenv/config";
import mongoose from "mongoose";
import Expense from "../models/Expense";
import Income from "../models/Income";

/**
 * One-off migration: replaces the old `{ user, dedupHash }` unique *sparse* index on the
 * expenses and incomes collections with a *partial* unique index.
 *
 * Why: a compound sparse index still indexes any document that has ANY of its keys. Every
 * document has `user`, so manually-added entries (no dedupHash) were indexed as
 * { user, dedupHash: null } and the second one per user failed with E11000.
 *
 * Changing the schema is not enough — MongoDB keeps the old index, and Mongoose can't
 * rebuild an index whose options changed, so it has to be dropped first.
 *
 * Idempotent: an index that is already partial is left untouched.
 *
 * Run with:
 *   npm run migrate:dedup-indexes
 * (from the backend/ directory, with MONGO_URI set in .env — run it once per database,
 * including production)
 */

const INDEX_NAME = "user_1_dedupHash_1";
/** MongoDB error codes: 26 = NamespaceNotFound (collection doesn't exist yet), 27 = IndexNotFound. */
const NAMESPACE_NOT_FOUND = 26;
const INDEX_NOT_FOUND = 27;

const errorCode = (err: unknown) => (err as { code?: number } | null)?.code;

interface IndexableModel {
  modelName: string;
  collection: {
    indexes(): Promise<{ name?: string; partialFilterExpression?: unknown }[]>;
    dropIndex(name: string): Promise<unknown>;
  };
  createIndexes(): Promise<unknown>;
}

export type MigrationOutcome = "replaced" | "already-partial" | "created";

/** Drops the legacy dedupHash index if it is not partial, then builds the schema's indexes. */
export async function rebuildDedupIndex(model: IndexableModel): Promise<MigrationOutcome> {
  let existing: { name?: string; partialFilterExpression?: unknown } | undefined;
  try {
    existing = (await model.collection.indexes()).find((i) => i.name === INDEX_NAME);
  } catch (err) {
    if (errorCode(err) !== NAMESPACE_NOT_FOUND) throw err; // no collection yet: nothing to drop
  }

  let outcome: MigrationOutcome = "created";
  if (existing?.partialFilterExpression) {
    outcome = "already-partial";
  } else if (existing) {
    try {
      await model.collection.dropIndex(INDEX_NAME);
    } catch (err) {
      if (errorCode(err) !== INDEX_NOT_FOUND) throw err; // already gone (e.g. concurrent run)
    }
    outcome = "replaced";
  }

  await model.createIndexes();
  return outcome;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment (.env)");
  }

  await mongoose.connect(uri);
  console.log(`Connected to MongoDB (${mongoose.connection.name}).`);

  for (const model of [Expense, Income]) {
    const outcome = await rebuildDedupIndex(model);
    console.log(`  ${model.modelName}: ${outcome}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}
