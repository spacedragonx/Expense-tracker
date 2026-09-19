import crypto from "crypto";
import { Schema, model, Document, Types, Model } from "mongoose";
import { IRecurrence } from "./Expense";

export type IncomeSource = "salary" | "freelance" | "investments" | "business" | "other";

export interface IIncome extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  amount: number;
  currency: string;
  date: Date;
  source: IncomeSource;
  notes?: string;
  recurrence: IRecurrence;
  /** Tracks whether this income was entered manually or imported from a bank statement. */
  origin: "manual" | "statement_import";
  /** sha256 fingerprint for duplicate detection across statement imports. */
  dedupHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IIncomeModel extends Model<IIncome> {
  computeHash(userId: string, date: string, amount: number, description: string, type?: string): string;
}

const incomeSchema = new Schema<IIncome>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: "INR" },
    date: { type: Date, required: true, default: Date.now, index: true },
    source: {
      type: String,
      enum: ["salary", "freelance", "investments", "business", "other"],
      default: "other",
    },
    notes: { type: String, maxlength: 500 },
    recurrence: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] },
      nextRunDate: { type: Date },
      endDate: { type: Date },
    },
    origin: {
      type: String,
      enum: ["manual", "statement_import"],
      default: "manual",
    },
    dedupHash: { type: String, sparse: true },
  },
  { timestamps: true }
);

incomeSchema.index({ user: 1, date: -1 });
// Sparse unique index ensures no two statement imports share the same fingerprint per user
incomeSchema.index({ user: 1, dedupHash: 1 }, { unique: true, sparse: true });

/**
 * Compute a stable deduplication hash.
 * sha256( userId | date | amount | normalizedDescription | type )
 * Mirrors Expense.computeHash so the same transaction hashes identically.
 */
incomeSchema.statics.computeHash = function (
  userId: string,
  date: string,
  amount: number,
  description: string,
  type: string = "income"
): string {
  const normalizedDesc = description
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  const payload = `${userId}|${date}|${amount}|${normalizedDesc}|${type}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
};

export default model<IIncome, IIncomeModel>("Income", incomeSchema);
