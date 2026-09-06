import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  currency: string; // ISO 4217 code, e.g. "USD", "INR"
  theme: "light" | "dark" | "system";
  isVerified: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    avatarUrl: { type: String },
    currency: { type: String, default: "INR" },
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    isVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default model<IUser>("User", userSchema);
