import mongoose, { Schema, Document } from "mongoose";
import { Role, Plan } from "@/types";
import { USE_MEMORY_DB, MemoryUser } from "@/lib/inMemoryDB";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  plan: Plan;
  avatar?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["superadmin", "admin", "user"], default: "user" },
    plan: { type: String, enum: ["free", "basic", "pro"], default: "free" },
    avatar: { type: String },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

const MongoUser = mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default (USE_MEMORY_DB ? MemoryUser : MongoUser) as any;
