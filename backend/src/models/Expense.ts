import { Schema, model, Document, Types } from "mongoose";

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
  createdAt: Date;
  updatedAt: Date;
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
  },
  { timestamps: true }
);

// Common query patterns: list by user within a date range, filter by category
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });

export default model<IExpense>("Expense", expenseSchema);
