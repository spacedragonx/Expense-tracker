import { Router, Request, Response } from "express";
import multer from "multer";
import asyncHandler from "express-async-handler";

import { protect } from "../middleware/authMiddleware";
import { extractPdfText } from "../services/pdfExtractor";
import { redactSensitiveData } from "../utils/redact";
import { colorForCategoryName } from "../utils/categoryColor";
import { parseStatementWithTieredLlm } from "../services/llmParser";
import { validateTransactions, ValidatedTransaction } from "../services/transactionValidator";
import Expense from "../models/Expense";
import Income, { IncomeSource } from "../models/Income";
import Category from "../models/Category";

const router = Router();

// ── Multer: memory storage, PDF only, 20 MB cap ──────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    const isOk =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    if (!isOk) {
      const err = new Error("Only PDF files are accepted") as Error & { statusCode?: number };
      err.statusCode = 415;
      return cb(err as unknown as null, false);
    }
    cb(null, true);
  },
});

// All statement routes require authentication
router.use(protect);

// ── Helper: resolve a category name to a MongoDB ObjectId (expense rows only) ─
// Color assignment lives in ../utils/categoryColor so the one-time migration
// script (backfillCategoryColors.ts) stays in sync with this.
async function resolveCategoryId(name: string, userId: string, kind: "expense" | "income"): Promise<string> {
  // 1. Try exact match on user's own category first
  let cat = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    kind: kind,
    user: userId,
  });

  // 2. Fall back to system default (user: null)
  if (!cat) {
    cat = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      kind: kind,
      user: null,
    });
  }

  // 3. Only create a new user-specific category if it truly doesn't exist anywhere
  if (!cat) {
    try {
      cat = await Category.create({
        user: userId,
        name: name || "Other",
        kind: kind,
        icon: "tag",
        color: colorForCategoryName(name || "Other"),
        isDefault: false,
      });
    } catch (err: any) {
      // Handle race condition if multiple rows try to create the same category simultaneously
      if (err.code === 11000) {
        cat = await Category.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
          kind: kind,
          user: userId,
        });
      }
      if (!cat) throw err;
    }
  }
  return cat._id.toString();
}

// ── Helper: map an LLM category label to the Income model's fixed source enum ─
// Income isn't categorized the way Expense is — it has a small fixed `source`
// enum instead of a Category ref. Anything that isn't clearly
// salary/freelance/investment/business income (including unrecognized peer
// transfers) falls into "other", which is exactly where it belongs — never
// into the Expense collection.
const CATEGORY_TO_INCOME_SOURCE: Record<string, IncomeSource> = {
  Salary: "salary",
  Freelance: "freelance",
  Investments: "investments",
};

function resolveIncomeSource(category: string): IncomeSource {
  return CATEGORY_TO_INCOME_SOURCE[category] ?? "other";
}

// ── Preview row shape (returned from /parse, accepted in /commit) ─────────────
export interface PreviewTransaction extends ValidatedTransaction {
  /** Computed hash — included so the frontend can track it without re-hashing. */
  dedupHash: string;
  /** True if this hash already exists in the DB (Expense or Income, matching this row's type) for this user. */
  isDuplicate: boolean;
}

// ── POST /api/statements/parse ────────────────────────────────────────────────
//    Upload PDF → extract → redact → LLM → validate → dedup check → preview
//    Does NOT write to the database.
router.post(
  "/parse",
  upload.single("statement"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded. Include a PDF as multipart field 'statement'.");
    }

    const userId = req.user!._id.toString();

    // 1. Extract text
    const { chunks } = await extractPdfText(req.file.buffer);

    // 2. Redact before any external call
    for (const chunk of chunks) {
      chunk.text = redactSensitiveData(chunk.text);
    }

    // 3. LLM parse (tiered models + validation)
    const { transactions: validTxns, chunkCount, failedChunks, rejectedCount } = await parseStatementWithTieredLlm(chunks);
    const valid = validTxns as ValidatedTransaction[];

    // 4. Compute dedup hashes and check DB in one bulk query per collection.
    const hashMap = new Map<string, ValidatedTransaction>();
    for (const txn of valid) {
      const h = Expense.computeHash(userId, txn.date, txn.amount, txn.description, txn.type);
      hashMap.set(h, txn);
    }

    const expenseHashes = [...hashMap.entries()].filter(([, t]) => t.type === "expense").map(([h]) => h);
    const incomeHashes = [...hashMap.entries()].filter(([, t]) => t.type === "income").map(([h]) => h);

    const [existingExpenseDocs, existingIncomeDocs] = await Promise.all([
      expenseHashes.length
        ? Expense.find({ user: userId, dedupHash: { $in: expenseHashes } }).select("dedupHash")
        : [],
      incomeHashes.length
        ? Income.find({ user: userId, dedupHash: { $in: incomeHashes } }).select("dedupHash")
        : [],
    ]);

    const existingHashes = new Set([
      ...existingExpenseDocs.map((d) => d.dedupHash as string),
      ...existingIncomeDocs.map((d) => d.dedupHash as string),
    ]);

    const preview: PreviewTransaction[] = [];
    for (const [hash, txn] of hashMap.entries()) {
      preview.push({
        ...txn,
        dedupHash: hash,
        isDuplicate: existingHashes.has(hash),
      });
    }

    res.json({
      success: true,
      data: {
        transactions: preview,
        rejectedCount,
        chunkCount,
        failedChunks,
      },
    });
  })
);

// ── POST /api/statements/commit ───────────────────────────────────────────────
//    Accept user-reviewed array → filter duplicates → re-validate → bulk insert
//    Expense-typed rows go to Expense; income-typed rows go to Income. Never
//    both to the same collection — that mismatch was silently turning
//    incoming transfers into expenses.
router.post(
  "/commit",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const { transactions } = req.body as { transactions: PreviewTransaction[] };

    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400);
      throw new Error("'transactions' must be a non-empty array.");
    }

    // Re-validate with Zod (don't trust client-edited data)
    // Map PreviewTransaction shape back to RawLlmTransaction shape for the validator
    const rawFormatForValidation = transactions.map(t => ({
      ...t,
      direction: t.type === "income" ? "credit" : "debit" as "credit" | "debit"
    }));
    const { valid, rejectedCount } = validateTransactions(rawFormatForValidation, { previousBalance: null, hasReliableBalance: false });

    if (valid.length === 0) {
      res.status(400);
      throw new Error(`All ${rejectedCount} rows failed validation — nothing to commit.`);
    }

    // Re-compute hashes (user may have edited the rows)
    const withHashes = valid.map((txn) => ({
      ...txn,
      dedupHash: Expense.computeHash(userId, txn.date, txn.amount, txn.description, txn.type),
    }));

    const expenseRows = withHashes.filter((t) => t.type === "expense");
    const incomeRows = withHashes.filter((t) => t.type === "income");

    // Filter out any hashes already in the matching collection
    const [existingExpenseDocs, existingIncomeDocs] = await Promise.all([
      expenseRows.length
        ? Expense.find({ user: userId, dedupHash: { $in: expenseRows.map((t) => t.dedupHash) } }).select("dedupHash")
        : [],
      incomeRows.length
        ? Income.find({ user: userId, dedupHash: { $in: incomeRows.map((t) => t.dedupHash) } }).select("dedupHash")
        : [],
    ]);
    const existingExpenseHashes = new Set(existingExpenseDocs.map((d) => d.dedupHash as string));
    const existingIncomeHashes = new Set(existingIncomeDocs.map((d) => d.dedupHash as string));

    const expenseToInsert = expenseRows.filter((t) => !existingExpenseHashes.has(t.dedupHash));
    const incomeToInsert = incomeRows.filter((t) => !existingIncomeHashes.has(t.dedupHash));

    const skippedDuplicates =
      (expenseRows.length - expenseToInsert.length) + (incomeRows.length - incomeToInsert.length);

    if (expenseToInsert.length === 0 && incomeToInsert.length === 0) {
      res.status(409);
      throw new Error("All submitted transactions are already in the database (duplicates).");
    }

    // Resolve expense category names → ObjectIds, then insert
    const expenseDocs = await Promise.all(
      expenseToInsert.map(async (txn) => {
        const categoryId = await resolveCategoryId(txn.category, userId, "expense");
        return {
          user: userId,
          title: txn.description,
          amount: txn.amount,
          currency: "INR",
          date: new Date(txn.date),
          category: categoryId,
          paymentMethod: "bank_transfer" as const,
          source: "statement_import" as const,
          dedupHash: txn.dedupHash,
          recurrence: { isRecurring: false },
          tags: [],
        };
      })
    );

    // Map income category labels → the Income model's fixed source enum, then insert
    const incomeDocs = incomeToInsert.map((txn) => ({
      user: userId,
      title: txn.description,
      amount: txn.amount,
      currency: "INR",
      date: new Date(txn.date),
      source: resolveIncomeSource(txn.category),
      origin: "statement_import" as const,
      dedupHash: txn.dedupHash,
      recurrence: { isRecurring: false },
    }));

    // Bulk insert — ignore duplicate-key errors gracefully (race condition safety)
    const [expenseResult, incomeResult] = await Promise.all([
      expenseDocs.length ? Expense.insertMany(expenseDocs, { ordered: false }) : [],
      incomeDocs.length ? Income.insertMany(incomeDocs, { ordered: false }) : [],
    ]);

    res.status(201).json({
      success: true,
      data: {
        savedCount: expenseResult.length + incomeResult.length,
        savedExpenseCount: expenseResult.length,
        savedIncomeCount: incomeResult.length,
        skippedDuplicates,
        rejectedCount,
      },
    });
  })
);

export default router;
