/**
 * Integration test for the E11000 "dup key { user, dedupHash: null }" bug, against a real
 * (in-memory) MongoDB — the DB-free checks live in dedupIndex.test.ts.
 *
 * It recreates the legacy `{ user, dedupHash }` unique *sparse* index, shows that manual
 * entries collide, runs the migration, and shows that they no longer do.
 */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Expense from "../models/Expense";
import Income from "../models/Income";
import { rebuildDedupIndex } from "../scripts/fixDedupHashIndexes";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([Expense.init(), Income.init()]); // make sure the schema's indexes exist first
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Expense.deleteMany({});
  await Income.deleteMany({});
});

const oid = () => new mongoose.Types.ObjectId();
const category = oid();

// Builders returning documents typed loosely enough to add a dedupHash.
const expenseDoc = (user: mongoose.Types.ObjectId, extra: Record<string, unknown> = {}) => ({
  user,
  title: "Tea",
  amount: 20,
  category,
  ...extra,
});
const incomeDoc = (user: mongoose.Types.ObjectId, extra: Record<string, unknown> = {}) => ({
  user,
  title: "Gift",
  amount: 500,
  ...extra,
});

describe.each([
  ["Expense", Expense, expenseDoc],
  ["Income", Income, incomeDoc],
] as const)("%s dedupHash uniqueness", (_name, Model, doc) => {
  // The Model union isn't callable with a single signature; the shapes are identical for these calls.
  const M = Model as unknown as {
    create(d: unknown): Promise<unknown>;
    countDocuments(): Promise<number>;
    collection: {
      dropIndex(n: string): Promise<unknown>;
      createIndex(k: object, o: object): Promise<unknown>;
    };
  };

  it("allows many manual entries (no dedupHash) for the same user", async () => {
    const user = oid();
    await expect(M.create(doc(user))).resolves.toBeDefined();
    await expect(M.create(doc(user))).resolves.toBeDefined();
    await expect(M.create(doc(user))).resolves.toBeDefined();
    expect(await M.countDocuments()).toBe(3);
  });

  it("still rejects a repeated dedupHash for the same user", async () => {
    const user = oid();
    await M.create(doc(user, { dedupHash: "abc" }));
    await expect(M.create(doc(user, { dedupHash: "abc" }))).rejects.toMatchObject({ code: 11000 });
  });

  it("allows the same dedupHash for different users, and manual entries next to imported ones", async () => {
    const [a, b] = [oid(), oid()];
    await M.create(doc(a, { dedupHash: "abc" }));
    await expect(M.create(doc(b, { dedupHash: "abc" }))).resolves.toBeDefined();
    await expect(M.create(doc(a))).resolves.toBeDefined();
    await expect(M.create(doc(a))).resolves.toBeDefined();
  });

  it("migration: reproduces the bug on the legacy sparse index, then fixes it", async () => {
    // Put the database back into the state of an existing install.
    await M.collection.dropIndex("user_1_dedupHash_1");
    await M.collection.createIndex({ user: 1, dedupHash: 1 }, { unique: true, sparse: true });

    const user = oid();
    await M.create(doc(user));
    await expect(M.create(doc(user))).rejects.toMatchObject({ code: 11000 }); // the reported error

    await expect(rebuildDedupIndex(Model as never)).resolves.toBe("replaced");

    await expect(M.create(doc(user))).resolves.toBeDefined(); // fixed
    await expect(M.create(doc(user))).resolves.toBeDefined();

    // Running it again is a no-op, and duplicate fingerprints are still blocked.
    await expect(rebuildDedupIndex(Model as never)).resolves.toBe("already-partial");
    await M.create(doc(user, { dedupHash: "xyz" }));
    await expect(M.create(doc(user, { dedupHash: "xyz" }))).rejects.toMatchObject({ code: 11000 });
  });
});
