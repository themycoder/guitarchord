import { Schema, model, Types } from "mongoose";

// Interface
export interface IPosition {
  string: number; // 1-6 (dây 1 là dây mỏng nhất)
  fret: number | null; // null = mute (X), 0 = open (O)
  finger?: number; // 1-4 (ngón tay)
  mute?: boolean; // true nếu là X
}

export interface IBarre {
  from_string: number; // Dây bắt đầu chặn (vd: 6)
  to_string: number; // Dây kết thúc chặn (vd: 1)
  fret: number; // Vị trí chặn (vd: 1)
  finger: number; // Ngón tay (thường là 1)
}

export interface IChordShape {
  chord_id: Types.ObjectId; // Liên kết đến hợp âm gốc
  variation: number; // Thứ tự thế bấm
  start_fret: number; // Khoang bắt đầu hiển thị
  positions: IPosition[];
  barre?: IBarre;
  type?: "standard" | "barre" | "power" | "open";
  difficulty?: number; // 1-5
  is_user_uploaded: boolean;
  created_at: Date;
}

// Schema
const ChordShapeSchema = new Schema<IChordShape>({
  chord_id: {
    type: Schema.Types.ObjectId,
    ref: "Chord",
    required: true,
    index: true,
  },
  variation: {
    type: Number,
    default: 1,
  },
  start_fret: {
    type: Number,
    required: true,
    min: 0,
  },
  positions: [
    {
      string: { type: Number, required: true, min: 1, max: 6 },
      fret: { type: Number, min: 0 }, // 0 = open, null = mute
      finger: { type: Number, min: 1, max: 4 },
      mute: { type: Boolean, default: false },
    },
  ],
  barre: {
    from_string: { type: Number, min: 1, max: 6 },
    to_string: { type: Number, min: 1, max: 6 },
    fret: { type: Number, min: 0 },
    finger: { type: Number, min: 1, max: 4 },
  },
  type: {
    type: String,
    enum: ["standard", "barre", "power", "open"],
    default: "standard",
  },
  difficulty: { type: Number, min: 1, max: 5 },
  is_user_uploaded: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});



// Validation: Đảm bảo start_fret ≤ fret nhỏ nhất khi save
ChordShapeSchema.pre<IChordShape>("save", function (next) {
  const activePositions = this.positions.filter((p) => p.fret !== null);
  if (activePositions.length > 0) {
    const minFret = Math.min(...activePositions.map((p) => p.fret as number));
    if (this.start_fret > minFret) {
      return next(
        new Error(
          `start_fret (${this.start_fret}) must be ≤ min fret (${minFret})`
        )
      );
    }
  }
  next();
});

// Validation tương tự khi dùng findOneAndUpdate / findByIdAndUpdate
ChordShapeSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as Partial<IChordShape> & { $set?: any };
  const $set = update.$set ?? {};
  const start_fret =
    $set.start_fret ?? (update as any).start_fret; // lấy từ $set hoặc root

  // Nếu không thay đổi positions và start_fret thì bỏ qua
  const positions =
    $set.positions ?? (update as any).positions ?? undefined;

  if (start_fret === undefined && positions === undefined) {
    return next();
  }

  // Lấy positions sau update (nếu không gửi lên thì cần đọc hiện tại)
  const runCheck = async () => {
    let finalPositions = positions;
    if (!finalPositions) {
      // đọc document hiện tại để có positions
      const doc: any = await (this as any).model.findOne(this.getQuery());
      finalPositions = doc?.positions || [];
    }
    const active = (finalPositions || []).filter((p: any) => p?.fret !== null);
    if (active.length > 0) {
      const minFret = Math.min(...active.map((p: any) => p.fret as number));
      const sf =
        start_fret !== undefined
          ? start_fret
          : (this as any).getOptions()?.overrides?.current_start_fret ??
            undefined;
      if (sf !== undefined && sf > minFret) {
        return next(
          new Error(`start_fret (${sf}) must be ≤ min fret (${minFret})`)
        );
      }
    }
    next();
  };

  runCheck().catch(next);
});
// Export
export const ChordShape = model<IChordShape>("ChordShape", ChordShapeSchema);
