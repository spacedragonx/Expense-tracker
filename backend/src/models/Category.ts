import { Schema, model, Document, Types } from "mongoose";

export type CategoryKind = "expense" | "income";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId | null; // null = system-defined default category
  name: string;
  kind: CategoryKind;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    kind: { type: String, enum: ["expense", "income"], required: true },
    icon: { type: String, default: "tag" },
    color: { type: String, default: "#10B981" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A user cannot have two categories with the same name + kind
categorySchema.index({ user: 1, name: 1, kind: 1 }, { unique: true });

export default model<ICategory>("Category", categorySchema);
