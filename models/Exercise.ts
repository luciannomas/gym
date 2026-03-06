import mongoose, { Schema, Document } from "mongoose";
import { USE_MEMORY_DB, MemoryExercise } from "@/lib/inMemoryDB";

export interface ExerciseDocument extends Document {
  name: string;
  category: string;
  muscleGroup: string[];
  description: string;
  videoUrl?: string;
  gifUrl?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  createdAt: Date;
}

const ExerciseSchema = new Schema<ExerciseDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    muscleGroup: [{ type: String }],
    description: { type: String, required: true },
    videoUrl: { type: String },
    gifUrl: { type: String },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  },
  { timestamps: true }
);

const MongoExercise = mongoose.models.Exercise || mongoose.model<ExerciseDocument>("Exercise", ExerciseSchema);

export default (USE_MEMORY_DB ? MemoryExercise : MongoExercise) as any;
