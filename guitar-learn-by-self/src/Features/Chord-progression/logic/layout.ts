export const MATRIX_LAYOUT = {
  header: { roman: ["I", "II", "III", "IV", "V", "VI", "VII"] },
  keysMajor: ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"],
  columns12: [
    // I
    {
      kind: "deg",
      roman: "I",
      rows: [
        ["Imaj7"],
        ["I"],
        ["IV/I"],
        ["V/I"],
        [], // row5
        ["I7"], // C7
        ["I6/9"], // C6/9
        
        ["#Idim7"], // C#dim7
      ],
    },
    // I–II (gap)
    {
      kind: "gap",
      between: "I-II",
      rows: [[], [], [], [], [], ["bII7"], ["bIImaj7"], []], // Db7, Dbmaj7
    },
    // II
    {
      kind: "deg",
      roman: "II",
      rows: [
        ["IIm7"],
        ["IIm"],
        [],
        [],
        ["II"], // row5
        ["II7"], // row6
        ["IIm6"], // Dm6
        
        [],
      ],
    },
    // II–III (gap)
    {
      kind: "gap",
      between: "II-III",
      rows: [[], [], [], [], [], ["bIII7"], [], ["#IIdim7"]], // Eb7, D#dim7
    },
    // III
    {
      kind: "deg",
      roman: "III",
      rows: [
        ["IIIm7"],
        ["IIIm"],
        ["I/III"],
        [],
        [],
        ["III7"], // E7
        [],
        
        [],
      ],
    },
    // IV
    {
      kind: "deg",
      roman: "IV",
      rows: [
        ["IVmaj7"],
        ["IV"],
        [],
        [],
        [],
        [],
        ["IVm6"], // Fm6
        
        [],
      ],
    },
    // IV–V (gap)
    {
      kind: "gap",
      between: "IV-V",
      rows: [
        [],
        [],
        ["II/#IV"], 
        [],
        ["II/IV#"], // row5
        ["#IVm7(b5)"], // F#m7(b5)
        [],
        
        ["#IVdim7"], // F#dim7
      ],
    },
    // V
    {
      kind: "deg",
      roman: "V",
      rows: [
        ["V7"],
        ["V"],
        ["IV/V"],
        ["I/V"],
        ["VIm/V"], // row5
        [],
        ["IIIm/V"], // row7
        
        [],
      ],
    },
    // V–VI (gap)
    {
      kind: "gap",
      between: "V-VI",
      rows: [[], [], [], [], [], ["bVI7"], [],  ["G#dim7"]], // Ab7
    },
    // VI
    {
      kind: "deg",
      roman: "VI",
      rows: [
        ["VIm7"],
        ["VIm"],
        ["IV/VI"],
        [],
        [],
        ["VI7"], // row6
        [],
        [],
        [],
      ],
    },
    // VI–VII (gap)
    {
      kind: "gap",
      between: "VI-VII",
      rows: [
        [],
        [],
        [],
        [],
        ["bVII"], // Bb (row5)
        ["bVII7"], // Bb7 (row6)
        ["I7/bVII"], // C7/Bb (row7)
        [],
        [], // bottom
      ],
    },
    // VII
    {
      kind: "deg",
      roman: "VII",
      rows: [
        ["VIIm7(b5)"],
        [],
        ["V/VII"], // G/B
        ["VII7"], // (giữ như hiện tại của bạn)
        [],
        ["VII7"], // B7 (row6)
        ["III7/VII"], // E7/B (row8)
        [],
      ],
    },
  ],
} as const;
