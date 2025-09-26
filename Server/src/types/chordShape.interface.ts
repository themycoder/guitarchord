import { Document } from "mongoose";

export interface Position {
  string: number; // 1-6 (dây 1 là dây mỏng nhất)
  fret: number | null; // null = không chơi (X), 0 = open (O)
  finger?: number; // 1-4 (ngón tay)
  mute?: boolean; // true nếu là X
}

export interface Barre {
  from_string: number; // Dây bắt đầu chặn
  to_string: number; // Dây kết thúc chặn
  fret: number; // Vị trí chặn
  finger: number; // Ngón tay (thường là 1)
}

export interface IChordShape extends Document {
  chord_id: string; // Liên kết đến hợp âm gốc (vd: "C", "Am")
  variation: number; // Số thứ tự thế bấm (vd: 1, 2, 3...)
  start_fret: number; // Khoang bắt đầu hiển thị (vd: 1)
  positions: Position[];
  barre?: Barre; // Thông tin chặn (nếu có)
  type?: "standard" | "barre" | "power" | "open";
  difficulty?: number; // Độ khó (1-5)
  is_user_uploaded: boolean;
  created_at: Date;
}
