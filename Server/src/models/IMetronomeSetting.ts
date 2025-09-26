import mongoose, { Schema, Document } from "mongoose";

export interface IMetronomeSetting extends Document {
  name: string;
  tempo: number;
  time_signature: string;
  accent_first_beat: boolean;
  sounds: string[]; // URL hoặc tên file âm thanh cho từng beat
  sound_style: string; // VD: "click", "wood", "electronic"
  volume: number; // 0 đến 100
  created_at: Date;
  created_by?: string; // ID người dùng nếu dùng tài khoản
}

const MetronomeSettingSchema: Schema = new Schema<IMetronomeSetting>({
  name: { type: String, required: true },
  tempo: { type: Number, required: true },
  time_signature: { type: String, default: "4/4" },
  accent_first_beat: { type: Boolean, default: true },
  sounds: [{ type: String }], // mỗi beat 1 âm thanh
  sound_style: { type: String, default: "click" },
  volume: { type: Number, default: 80 },
  created_at: { type: Date, default: Date.now },
  created_by: { type: String }, // ID người dùng nếu cần cá nhân hóa
});

export default mongoose.model<IMetronomeSetting>(
  "MetronomeSetting",
  MetronomeSettingSchema
);
