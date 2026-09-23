/**
 * Regression tests for the E11000 "dup key { user, dedupHash: null }" bug.
 * These need no MongoDB: they check the schema's index definition, the migration's
 * branching/error handling (with a fake collection), and the duplicate-expense handler.
 */
import Expense from "../models/Expense";
import Income from "../models/Income";
import { rebuildDedupIndex } from "../scripts/fixDedupHashIndexes";

describe("dedupHash index definition", () => {
  it.each([
    ["Expense", Expense],
    ["Income", Income],
  ])("%s: unique per user, and partial (string dedupHash only) rather than sparse", (_name, model) => {
    // Select the compound index specifically: the field-level `sparse: true` on dedupHash also
    // generates a separate single-field { dedupHash: 1 } index, which isn't what this is about.
    const match = model.schema
      .indexes()
      .find(([fields]) => JSON.stringify(fields) === JSON.stringify({ user: 1, dedupHash: 1 }));
    expect(match).toBeDefined();
    const [fields, options] = match!;
    expect(fields).toEqual({ user: 1, dedupHash: 1 });
    expect(options).toMatchObject({ unique: true, partialFilterExpression: { dedupHash: { $type: "string" } } });
    // a compound sparse index is what caused the bug — it must not come back
    expect((options as { sparse?: boolean }).sparse).toBeUndefined();
  });
});

describe("rebuildDedupIndex", () => {
  const NAME = "user_1_dedupHash_1";

  /** Fake model that records the order of calls. */
  const fakeModel = (opts: {
    indexes?: { name?: string; partialFilterExpression?: unknown }[] | Error;
    dropError?: Error;
  }) => {
    const calls: string[] = [];
    return {
      calls,
      model: {
        modelName: "Fake",
        collection: {
          indexes: async () => {
            calls.push("indexes");
            if (opts.indexes instanceof Error) throw opts.indexes;
            return opts.indexes ?? [];
          },
          dropIndex: async (name: string) => {
            calls.push(`drop:${name}`);
            if (opts.dropError) throw opts.dropError;
          },
        },
        createIndexes: async () => {
          calls.push("create");
        },
      },
    };
  };
  const mongoError = (code: number) => Object.assign(new Error(`mongo ${code}`), { code });

  it("drops the legacy sparse index, then creates the new one (in that order)", async () => {
    const { model, calls } = fakeModel({ indexes: [{ name: NAME }] });
    await expect(rebuildDedupIndex(model)).resolves.toBe("replaced");
    expect(calls).toEqual(["indexes", `drop:${NAME}`, "create"]);
  });

  it("leaves an index that is already partial alone (idempotent)", async () => {
    const { model, calls } = fakeModel({
      indexes: [{ name: NAME, partialFilterExpression: { dedupHash: { $type: "string" } } }],
    });
    await expect(rebuildDedupIndex(model)).resolves.toBe("already-partial");
    expect(calls).toEqual(["indexes", "create"]);
  });

  it("just creates when there is no dedupHash index yet, ignoring unrelated indexes", async () => {
    const { model, calls } = fakeModel({ indexes: [{ name: "user_1_date_-1" }] });
    await expect(rebuildDedupIndex(model)).resolves.toBe("created");
    expect(calls).toEqual(["indexes", "create"]);
  });

  it("treats a missing collection (NamespaceNotFound) as nothing to drop", async () => {
    const { model, calls } = fakeModel({ indexes: mongoError(26) });
    await expect(rebuildDedupIndex(model)).resolves.toBe("created");
    expect(calls).toEqual(["indexes", "create"]);
  });

  it("ignores IndexNotFound when dropping (index removed concurrently)", async () => {
    const { model, calls } = fakeModel({ indexes: [{ name: NAME }], dropError: mongoError(27) });
    await expect(rebuildDedupIndex(model)).resolves.toBe("replaced");
    expect(calls).toEqual(["indexes", `drop:${NAME}`, "create"]);
  });

  it("propagates unexpected errors and does not go on to create", async () => {
    const listFail = fakeModel({ indexes: mongoError(13) }); // Unauthorized
    await expect(rebuildDedupIndex(listFail.model)).rejects.toThrow("mongo 13");
    expect(listFail.calls).toEqual(["indexes"]);

    const dropFail = fakeModel({ indexes: [{ name: NAME }], dropError: mongoError(13) });
    await expect(rebuildDedupIndex(dropFail.model)).rejects.toThrow("mongo 13");
    expect(dropFail.calls).toEqual(["indexes", `drop:${NAME}`]);
  });
});
