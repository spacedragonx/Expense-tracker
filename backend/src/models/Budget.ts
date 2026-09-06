import { Schema, model, Document, Types } from "mongoose";

export interface ICategoryBudget {
  category: Types.ObjectId;
  limit: number;
}

export interface IBudget extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  month: number; // 1-12
  year: number;
  totalLimit: number;
  categoryLimits: ICategoryBudget[];
  alertThresholdPercent: number; // e.g. 80 -> alert at 80% used
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    totalLimit: { type: Number, required: true, min: 0 },
    categoryLimits: [
      {
        category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        limit: { type: Number, required: true, min: 0 },
      },
    ],
    alertThresholdPercent: { type: Number, default: 80, min: 1, max: 100 },
  },
  { timestamps: true }
);

// One budget document per user per month/year
budgetSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export default model<IBudget>("Budget", budgetSchema);
