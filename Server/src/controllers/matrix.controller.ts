import { Request, Response } from "express";
import { ok } from "../utils/http";

/** Layout 12 cột = I .. VII + các khe giữa bậc cách 1 cung.
 *  Token đều là ROMAN (Imaj7, IIm, V/ii, bVII, I/III, #Idim7, ...).
 *  FE sẽ đổi sang tên hợp âm thực theo key.
 */
export const getMatrixMeta = async (_req: Request, res: Response) => {
  const layout = {
    header: { roman: ["I", "II", "III", "IV", "V", "VI", "VII"] },
    columns12: [
      // I
      {
        kind: "deg",
        roman: "I",
        rows: [["Imaj7"], ["I"], ["IV/I", "V/I"], []],
      },
      // I-II (gap)
      {
        kind: "gap",
        between: "I-II",
        rows: [[], ["I7"], ["bIImaj7"], ["#Idim7"]],
      },
      // II
      { kind: "deg", roman: "II", rows: [["IIm7"], ["IIm"], ["II"], []] },
      // II-III (gap)
      { kind: "gap", between: "II-III", rows: [[], ["II7"], [], ["#IIdim7"]] },
      // III   (E–F là 1/2 cung nên KHÔNG có gap trước IV)
      {
        kind: "deg",
        roman: "III",
        rows: [["IIIm7"], ["IIIm", "I/III"], ["III7"], []],
      },
      // IV
      {
        kind: "deg",
        roman: "IV",
        rows: [["IVmaj7"], ["IV"], [], ["#IVm7(b5)"]],
      },
      // IV-V (gap)
      { kind: "gap", between: "IV-V", rows: [[], [], ["#IVdim7"], []] },
      // V
      {
        kind: "deg",
        roman: "V",
        rows: [
          ["V7"],
          ["V", "IV/V", "I/V"],
          ["I/V"], // hàng xám kế tiếp theo ảnh (I/V lặp để điền slot)
          [],
        ],
      },
      // VI
      {
        kind: "deg",
        roman: "VI",
        rows: [["VIm7"], ["VIm", "IV/VI"], ["bVI7"], ["VI7"]],
      },
      // VI-VII (gap)
      { kind: "gap", between: "VI-VII", rows: [[], [], [], []] },
      // VII  (B–C là 1/2 cung nên KHÔNG có gap sau VII)
      {
        kind: "deg",
        roman: "VII",
        rows: [["VIIm7(b5)"], [], ["V/VII"], ["III7/VII", "I7/bVII", "VII7"]],
      },
    ],
  };

  const meta = {
    displayModes: ["degree", "absolute"],
    columns: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
    groups: [
      { name: "Triads", items: ["I", "ii", "iii", "IV", "V", "vi", "vii°"] },
      {
        name: "Sevenths",
        items: ["Imaj7", "IIm7", "IIIm7", "IVmaj7", "V7", "VIm7", "VIIm7(b5)"],
      },
      {
        name: "Special",
        items: [
          "I/III",
          "IV/I",
          "V/I",
          "IV/V",
          "I/V",
          "bIImaj7",
          "#Idim7",
          "#IIdim7",
          "#IVdim7",
          "#IVm7(b5)",
          "bVI7",
          "VI7",
          "V/VII",
          "III7/VII",
          "I7/bVII",
          "VII7",
        ],
      },
    ],
    keysMajor: [
      "C",
      "G",
      "D",
      "A",
      "E",
      "B",
      "F#",
      "Db",
      "Ab",
      "Eb",
      "Bb",
      "F",
    ],
    layout,
  };

  return ok(res, meta);
};
