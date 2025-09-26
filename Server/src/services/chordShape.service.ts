import { ChordShape } from "../models/chordShape.model";
import type {
  IChordShape,
  IPosition,
  IBarre,
} from "../models/chordShape.model";

class ChordShapeService {
  // Tạo thế bấm mới
  async create(
    shapeData: Omit<IChordShape, "created_at">
  ): Promise<IChordShape> {
    const newShape = new ChordShape(shapeData);
    return await newShape.save();
  }

  // Lấy tất cả thế bấm của hợp âm
  async getByChordId(chord_id: string): Promise<IChordShape[]> {
    return await ChordShape.find({ chord_id }).sort("variation").exec();
  }

  // Lấy thế bấm theo ID
  async getById(id: string): Promise<IChordShape | null> {
    return await ChordShape.findById(id).exec();
  }

  // Cập nhật thế bấm
  async update(
    id: string,
    updateData: Partial<IChordShape>
  ): Promise<IChordShape | null> {
    return await ChordShape.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      context: "query", // giúp 1 số validator hook hiểu đúng ngữ cảnh
    }).exec();
  }

  // Xóa thế bấm
  async delete(id: string): Promise<void> {
    await ChordShape.findByIdAndDelete(id).exec();
  }

  // Tìm thế bấm theo vị trí ngón tay (ví dụ cho advanced query)
  async findByPositions(positions: IPosition[]): Promise<IChordShape[]> {
    return await ChordShape.find({
      positions: {
        $all: positions.map((p) => ({
          $elemMatch: {
            string: p.string,
            fret: p.fret,
            finger: p.finger,
          },
        })),
      },
    }).exec();
  }

  // Kiểm tra hợp âm chặn
  async hasBarre(chord_id: string): Promise<boolean> {
    const count = await ChordShape.countDocuments({
      chord_id,
      barre: { $exists: true },
    }).exec();
    return count > 0;
  }
}

// Export singleton instance
export const chordShapeService = new ChordShapeService();
