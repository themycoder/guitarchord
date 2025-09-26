import Chord from "../models/Chord.model";

export async function findChords(notes: string[]) {
  const mainNote = notes[0]; // Note đầu tiên là note chính chủ

  // 1. Tìm hợp âm chính xác (nếu có từ 2 note trở lên)
  if (notes.length >= 2) {
    const exactMatch = await findExactMatch(notes, mainNote);
    if (exactMatch.length > 0) {
      return {
        success: true,
        matchType: "exact",
        chords: exactMatch,
      };
    }
  }

  // 2. Tìm hợp âm chứa tất cả nốt (kể cả khi chỉ có 1 note)
  const containsAll = await findContainsAll(notes, mainNote);
  if (containsAll.length > 0) {
    return {
      success: true,
      matchType: "containsAll",
      chords: containsAll,
    };
  }

  // 3. Tìm hợp âm có ít nhất 1 nốt trùng
  const partialMatch = await findPartialMatch(notes, mainNote);
  if (partialMatch.length > 0) {
    return {
      success: true,
      matchType: "partial",
      chords: partialMatch,
    };
  }

  // 4. Trả kết quả cuối cùng
  return {
    success: true,
    matchType: "none",
    chords: [],
    message: "Không tìm thấy hợp âm phù hợp",
  };
}

async function findExactMatch(notes: string[], mainNote: string) {
  return Chord.aggregate([
    {
      $match: {
        $or: [
          { notes: { $all: notes, $size: notes.length } },
          {
            notes: {
              $all: notes.map((n) => n.replace(/#/g, "♯")),
              $size: notes.length,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        startsWithMainNote: {
          $cond: [
            { $eq: [{ $substr: ["$name", 0, 1] }, mainNote.charAt(0)] },
            1,
            0,
          ],
        },
      },
    },
    {
      $sort: {
        startsWithMainNote: -1,
        difficulty: 1,
      },
    },
    { $limit: 6 },
  ]);
}

async function findContainsAll(notes: string[], mainNote: string) {
  return Chord.aggregate([
    {
      $match: {
        $or: [
          { notes: { $all: notes } },
          { notes: { $all: notes.map((n) => n.replace(/#/g, "♯")) } },
        ],
      },
    },
    {
      $addFields: {
        isMainNoteFirst: {
          $cond: [{ $eq: [{ $arrayElemAt: ["$notes", 0] }, mainNote] }, 1, 0],
        },
        isNameStartsWithMainNote: {
          $cond: [
            { $eq: [{ $substr: ["$name", 0, 1] }, mainNote.charAt(0)] },
            1,
            0,
          ],
        },
        matchCount: {
          $size: {
            $setIntersection: [
              "$notes",
              notes.concat(notes.map((n) => n.replace(/#/g, "♯"))),
            ],
          },
        },
      },
    },
    {
      $sort: {
        isMainNoteFirst: -1,
        isNameStartsWithMainNote: -1,
        matchCount: -1,
        difficulty: 1,
      },
    },
    { $limit: 6 },
  ]);
}

async function findPartialMatch(notes: string[], mainNote: string) {
  return Chord.aggregate([
    {
      $addFields: {
        matchCount: {
          $max: [
            { $size: { $setIntersection: ["$notes", notes] } },
            {
              $size: {
                $setIntersection: [
                  "$notes",
                  notes.map((n) => n.replace(/#/g, "♯")),
                ],
              },
            },
          ],
        },
        isMainNoteFirst: {
          $cond: [{ $eq: [{ $arrayElemAt: ["$notes", 0] }, mainNote] }, 1, 0],
        },
        isNameStartsWithMainNote: {
          $cond: [
            { $eq: [{ $substr: ["$name", 0, 1] }, mainNote.charAt(0)] },
            1,
            0,
          ],
        },
      },
    },
    { $match: { matchCount: { $gte: 1 } } },
    {
      $sort: {
        isMainNoteFirst: -1,
        isNameStartsWithMainNote: -1,
        matchCount: -1,
        difficulty: 1,
      },
    },
    { $limit: 6 },
  ]);
}
