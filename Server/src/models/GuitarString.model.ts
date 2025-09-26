// models/GuitarString.ts
import { Document, model, Schema } from "mongoose";

export interface IGuitarString extends Document {
  name: string;
  tuning: string[];
  description?: string;
  createdAt: Date;
}

const GuitarStringSchema = new Schema<IGuitarString>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  tuning: {
    type: [String],
    required: true,
    validate: {
      validator: function (v: string[]) {
        return v.length === 6; // 6 dây đàn
      },
      message: (props: any) => `${props.value} phải có 6 nốt tuning!`,
    },
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const GuitarString = model<IGuitarString>(
  "GuitarString",
  GuitarStringSchema
);
