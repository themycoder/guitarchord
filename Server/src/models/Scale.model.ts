import mongoose, { Schema, Document } from "mongoose";

export interface IPosition {
  string: number;
  fret: number;
  note: string;
  octave: number;
  degree: string;
}

export interface IBoxPositions {
  box: number;
  positions: IPosition[];
}

export interface IScale extends Document {
  scale: string; // Ví dụ: "C major"
  notes: string[];
  degrees: string[];
  positions_by_box: IBoxPositions[];
  created_at?: Date;
}

const PositionSchema: Schema = new Schema<IPosition>({
  string: { type: Number, required: true },
  fret: { type: Number, required: true },
  note: { type: String, required: true },
  octave: { type: Number, required: true },
  degree: { type: String, required: true },
});

const BoxPositionsSchema: Schema = new Schema<IBoxPositions>({
  box: { type: Number, required: true },
  positions: { type: [PositionSchema], required: true },
});

const ScaleSchema: Schema = new Schema<IScale>({
  scale: { type: String, required: true },
  notes: { type: [String], required: true },
  degrees: { type: [String], required: true },
  positions_by_box: { type: [BoxPositionsSchema], required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IScale>("Scale", ScaleSchema);
