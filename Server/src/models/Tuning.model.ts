import mongoose, { Schema, Document } from "mongoose";

export interface ITuning extends Document {
  name: string;
  tuning: string[];
  description?: string;
}

const TuningSchema: Schema = new Schema<ITuning>({
  name: { type: String, required: true },
  tuning: { type: [String], required: true },
  description: String,
});

export default mongoose.model<ITuning>("Tuning", TuningSchema);
