import React, { useState, useMemo } from "react";

const Fretboard = ({
  shape,
  initialHorizontal = false,
  initialLeftHanded = false,
}) => {
  if (!shape || !shape.positions) return null;

  const [horizontal, setHorizontal] = useState(initialHorizontal);
  const [leftHanded, setLeftHanded] = useState(initialLeftHanded);

  const frets = 5;
  const stringCount = 6;

  
  const width = horizontal ? 230 : 170;
  const height = horizontal ? 170 : 230;

  const padding = 18;           // lề trong lưới
  const labelPadX = 22;         // khoảng cách nhãn số dây theo trục X
  const labelPadYTop = 10;      // khoảng cách nhãn trên đỉnh
  const labelPadYBottom = 14;   // khoảng cách nhãn đáy

  const gridW = width - padding * 2;
  const gridH = height - padding * 2;

  // khi dọc: dây là cột (x), khi ngang: dây là hàng (y)
  const stringGap = (horizontal ? gridH : gridW) / (stringCount - 1);
  const fretGap   = (horizontal ? gridW : gridH) / frets;

  // thứ tự hiển thị cố định 6→1; lật hình bằng mx()
  const displayIndexToStringNo = (i) => 6 - i;

  const stringsArray = useMemo(() => Array(stringCount).fill("x"), []);
  const fingersArray = useMemo(() => Array(stringCount).fill(null), []);

  const positiveFrets = shape.positions
    .filter((p) => typeof p.fret === "number" && p.fret > 0)
    .map((p) => p.fret);

  let minFret = positiveFrets.length ? Math.min(...positiveFrets) : 1;
  let maxFret = positiveFrets.length ? Math.max(...positiveFrets) : 1;

  let startFret = minFret > 1 ? minFret : 1;
  if (maxFret - startFret + 1 > frets) startFret = maxFret - frets + 1;
  if (startFret < 1) startFret = 1;

  for (let i = 0; i < stringCount; i++) {
    const stringNo = displayIndexToStringNo(i);
    const pos = shape.positions.find((p) => p.string === stringNo);
    if (!pos) continue;
    if (pos.mute) stringsArray[i] = "x";
    else if (pos.fret === 0) stringsArray[i] = 0;
    else if (typeof pos.fret === "number" && pos.fret > 0) {
      stringsArray[i] = pos.fret;
      if (pos.finger) fingersArray[i] = pos.finger;
    }
  }

  const showNut = startFret === 1;

  const stringCoord = (i) => padding + i * stringGap;
  const fretLineCoord = (i) => padding + i * fretGap;

  const gridMinX = padding;
  const gridMaxX = padding + gridW;
  const gridMinY = padding;
  const gridMaxY = padding + gridH;

  // mirror X cho tay trái (không scale text)
  const mx = (x) => (leftHanded ? gridMinX + gridMaxX - x : x);

  // BARRE
  const b = shape.barre;
  let barreEl = null;
  if (b && typeof b.fret === "number") {
    const fretIndex = b.fret - startFret + 1;
    if (fretIndex >= 0 && fretIndex <= frets) {
      const dispFrom = 6 - b.from_string;
      const dispTo   = 6 - b.to_string;
      const a = Math.min(dispFrom, dispTo);
      const c = Math.max(dispFrom, dispTo);

      if (horizontal) {
        const centerX = mx(padding + fretIndex * fretGap - fretGap / 2);
        const y1 = stringCoord(a), y2 = stringCoord(c);
        barreEl = (
          <rect
            x={centerX - 7}
            y={Math.min(y1, y2) - 7}
            width={14}
            height={Math.abs(y2 - y1) + 14}
            rx={7}
            ry={7}
            className="fill-slate-800 dark:fill-slate-200 opacity-80"
          />
        );
      } else {
        const centerY = padding + fretIndex * fretGap - fretGap / 2;
        const x1 = mx(stringCoord(a)), x2 = mx(stringCoord(c));
        barreEl = (
          <rect
            x={Math.min(x1, x2) - 10}
            y={centerY - 7}
            width={Math.abs(x2 - x1) + 20}
            height={14}
            rx={7}
            ry={7}
            className="fill-slate-800 dark:fill-slate-200 opacity-80"
          />
        );
      }
    }
  }

  return (
    <div className="inline-block text-slate-800 dark:text-slate-200">
      <div className="mb-1 flex items-center gap-2 justify-center">
        {shape.name && (
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {shape.name}
          </div>
        )}
        <button
          onClick={() => setHorizontal((v) => !v)}
          className="px-2 py-1 text-xs rounded-md border hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {horizontal ? "Dọc" : "Nằm ngang"}
        </button>
        <button
          onClick={() => setLeftHanded((v) => !v)}
          className="px-2 py-1 text-xs rounded-md border hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {leftHanded ? "Tay phải" : "Tay trái"}
        </button>
      </div>

      <svg
        width={width}
        height={height}
        className="select-none"
        style={{ display: "block", margin: "0 auto", overflow: "visible" }}  
      >
        {/* LƯỚI */}
        {horizontal ? (
          <>
            {/* DÂY = HÀNG */}
            {Array.from({ length: stringCount }).map((_, i) => {
              const y = stringCoord(i);
              return (
                <line
                  key={`s-${i}`}
                  x1={mx(gridMinX)}
                  y1={y}
                  x2={mx(gridMaxX)}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.9}
                />
              );
            })}
            {/* PHÍM = CỘT */}
            {Array.from({ length: frets + 1 }).map((_, i) => {
              const x = mx(fretLineCoord(i));
              const isNut = showNut && i === 0;
              return (
                <line
                  key={`f-${i}`}
                  x1={x}
                  y1={gridMinY}
                  x2={x}
                  y2={gridMaxY}
                  stroke="currentColor"
                  strokeWidth={isNut ? 4 : 1}
                  strokeLinecap="round"
                  opacity={isNut ? 1 : 0.7}
                />
              );
            })}

            {/* SỐ DÂY (ngang) – phía đối diện X/O */}
            {Array.from({ length: stringCount }).map((_, i) => {
              const y = stringCoord(i) + 3;
              const stringNo = displayIndexToStringNo(i);
              const baseX = gridMaxX + labelPadX; // mặc định bên phải
              return (
                <text
                  key={`sn-${i}`}
                  x={mx(baseX)}
                  y={y}
                  fontSize="10"
                  textAnchor={leftHanded ? "end" : "start"}
                  className="fill-slate-500 dark:fill-slate-400"
                >
                  {stringNo}
                </text>
              );
            })}

            {/* X/O (ngang) */}
            {stringsArray.map((v, i) => {
              if (v !== "x" && v !== 0) return null;
              const y = stringCoord(i);
              const baseX = gridMinX - 10; // mặc định bên trái
              return (
                <text
                  key={`mo-${i}`}
                  x={mx(baseX)}
                  y={y + 3}
                  textAnchor={leftHanded ? "start" : "end"}
                  fontSize="10"
                  className="fill-slate-700 dark:fill-slate-300"
                >
                  {v === "x" ? "x" : "o"}
                </text>
              );
            })}
          </>
        ) : (
          <>
            {/* DÂY = CỘT */}
            {Array.from({ length: stringCount }).map((_, i) => {
              const x = mx(stringCoord(i));
              return (
                <line
                  key={`s-${i}`}
                  x1={x}
                  y1={gridMinY}
                  x2={x}
                  y2={gridMaxY}
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.9}
                />
              );
            })}
            {/* PHÍM = HÀNG */}
            {Array.from({ length: frets + 1 }).map((_, i) => {
              const y = fretLineCoord(i);
              const isNut = showNut && i === 0;
              return (
                <line
                  key={`f-${i}`}
                  x1={mx(gridMinX)}
                  y1={y}
                  x2={mx(gridMaxX)}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={isNut ? 4 : 1}
                  strokeLinecap="round"
                  opacity={isNut ? 1 : 0.7}
                />
              );
            })}

            {/* SỐ DÂY (dọc) – VẼ CẢ TRÊN & DƯỚI cho chắc chắn không bị cắt */}
            {Array.from({ length: stringCount }).map((_, i) => {
              const x = mx(stringCoord(i));
              const stringNo = displayIndexToStringNo(i);
              return (
                <g key={`sn-${i}`}>
                
                  {/* Dưới đáy */}
                  <text
                    x={x}
                    y={gridMaxY + labelPadYBottom}
                    fontSize="10"
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400"
                  >
                    {stringNo}
                  </text>
                </g>
              );
            })}

            {/* X/O (dọc) – trên đỉnh, không đụng vào số dây (vì số dây có 2 nơi) */}
            {stringsArray.map((v, i) => {
              if (v !== "x" && v !== 0) return null;
              const x = mx(stringCoord(i));
              const y = gridMinY - 2; // sát đỉnh (số dây vẫn thấy vì cách ra 10px)
              return (
                <text
                  key={`mo-${i}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontSize="10"
                  className="fill-slate-700 dark:fill-slate-300"
                >
                  {v === "x" ? "x" : "o"}
                </text>
              );
            })}
          </>
        )}

        {/* BARRE */}
        {barreEl}

        {/* DOTS + số ngón */}
        {stringsArray.map((v, i) => {
          if (typeof v !== "number" || v <= 0) return null;
          const fretIndex = v - startFret + 1;
          if (fretIndex < 0 || fretIndex > frets) return null;

          const cx = horizontal
            ? mx(padding + fretIndex * fretGap - fretGap / 2)
            : mx(stringCoord(i));

          const cy = horizontal
            ? stringCoord(i)
            : padding + fretIndex * fretGap - fretGap / 2;

          return (
            <g key={`dot-${i}`}>
              <circle cx={cx} cy={cy} r={7} className="fill-slate-900 dark:fill-slate-200" />
              {fingersArray[i] ? (
                <text
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  fontSize="10"
                  className="fill-white dark:fill-slate-900"
                >
                  {fingersArray[i]}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* startFret label */}
        {!showNut &&
          (horizontal ? (
            <text
              x={mx(gridMinX + fretGap)}
              y={gridMinY - 6}
              fontSize="10"
              className="fill-slate-500 dark:fill-slate-400"
              textAnchor="middle"
            >
              {startFret}
            </text>
          ) : (
            <text
              x={leftHanded ? (gridMinX - 6) : (gridMaxX + 6)}
              y={gridMinY + fretGap}
              fontSize="10"
              className="fill-slate-500 dark:fill-slate-400"
              textAnchor={leftHanded ? "end" : "start"}
              alignmentBaseline="middle"
            >
              {startFret}
            </text>
          ))}
      </svg>
    </div>
  );
};

export default Fretboard;
