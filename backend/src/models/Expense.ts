import crypto from "crypto";
import { Schema, model, Document, Types, Model } from "mongoose";

export type PaymentMethod =
  | "cash"
  | "card"
  | "upi"
  | "bank_transfer"
  | "wallet"
  | "other";

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface IRecurrence {
  isRecurring: boolean;
  frequency?: RecurrenceFrequency;
  nextRunDate?: Date;
  endDate?: Date;
}

export interface IExpense extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  amount: number;
  currency: string;
  date: Date;
  category: Types.ObjectId;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptUrl?: string;
  tags: string[];
  recurrence: IRecurrence;
  /** Tracks whether this expense was entered manually or imported from a bank statement. */
  source: "manual" | "statement_import";
  /** sha256 fingerprint for duplicate detection across statement imports. */
  dedupHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IExpenseModel extends Model<IExpense> {
  computeHash(userId: string, date: string, amount: number, description: string, type?: string): string;
}

const expenseSchema = new Schema<IExpense>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "INR" },
    date: { type: Date, required: true, default: Date.now, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "wallet", "other"],
      default: "card",
    },
    notes: { type: String, maxlength: 500 },
    receiptUrl: { type: String },
    tags: [{ type: String, trim: true }],
    recurrence: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] },
      nextRunDate: { type: Date },
      endDate: { type: Date },
    },
    source: {
      type: String,
      enum: ["manual", "statement_import"],
      default: "manual",
    },
    dedupHash: { type: String, sparse: true },
  },
  { timestamps: true }
);

// Common query patterns: list by user within a date range, filter by category
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });
// Unique per user, but only for documents that actually carry a fingerprint (statement imports).
// This must be a *partial* index, not `sparse`: a compound sparse index still indexes any document
// that has ANY of its keys, and every expense has `user`, so manual expenses (no dedupHash) were
// all stored as { user, dedupHash: null } and the second one per user threw E11000.
expenseSchema.index(
  { user: 1, dedupHash: 1 },
  { unique: true, partialFilterExpression: { dedupHash: { $type: "string" } } }
);

/**
 * Compute a stable deduplication hash.
 * sha256( userId | date | amount | normalizedDescription | type )
 */
expenseSchema.statics.computeHash = function (
  userId: string,
  date: string,
  amount: number,
  description: string,
  type: string = "expense"
): string {
  // Normalize description by removing special characters and extra spaces, but keep alphanumeric
  const normalizedDesc = description
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  const payload = `${userId}|${date}|${amount}|${normalizedDesc}|${type}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
};

export default model<IExpense, IExpenseModel>("Expense", expenseSchema);
