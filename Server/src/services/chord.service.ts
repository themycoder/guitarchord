import Chord from "../models/Chord.model";

// Có thể thêm các hàm helper cho chord ở đây nếu cần
export async function getChordByName(name: string) {
  return Chord.findOne({ name });
}

// Thêm các hàm khác nếu cần
