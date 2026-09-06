import { Schema, model, Document, Types } from "mongoose";
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
  createdAt: Date;
  updatedAt: Date;
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
  },
  { timestamps: true }
);

incomeSchema.index({ user: 1, date: -1 });

export default model<IIncome>("Income", incomeSchema);
