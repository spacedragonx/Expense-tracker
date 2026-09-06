import { Schema, model, Document, Types } from "mongoose";

export interface IGoal extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  isCompleted: boolean;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  progressPercent: number; // virtual
}

const goalSchema = new Schema<IGoal>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date },
    isCompleted: { type: Boolean, default: false },
    icon: { type: String, default: "flag" },
  },
  { timestamps: true }
);

goalSchema.virtual("progressPercent").get(function (this: IGoal) {
  if (this.targetAmount <= 0) return 0;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

goalSchema.set("toJSON", { virtuals: true });
goalSchema.set("toObject", { virtuals: true });

goalSchema.pre("save", function (next) {
  this.isCompleted = this.currentAmount >= this.targetAmount;
  next();
});

goalSchema.index({ user: 1, isCompleted: 1 });

export default model<IGoal>("Goal", goalSchema);
