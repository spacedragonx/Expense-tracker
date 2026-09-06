import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "budget_exceeded"
  | "budget_warning"
  | "goal_milestone"
  | "monthly_summary"
  | "upcoming_bill";

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["budget_exceeded", "budget_warning", "goal_milestone", "monthly_summary", "upcoming_bill"],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default model<INotification>("Notification", notificationSchema);
