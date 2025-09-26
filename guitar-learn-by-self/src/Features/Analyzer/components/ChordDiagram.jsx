import React from "react";
import { useChordShape } from "../Hook/useChordShape";

/**
 * Props:
 *  - chordName?: string
 *  - positions?: Array<{string,fret,finger?,mute?}>
 *  - barre?: { fret, from_string, to_string }
 *  - startFret?: number
 *  - name?: string
 *  - hideName?: boolean          // NEW: ẩn tên trên đầu diagram
 *  - scale?: number              // NEW: phóng to/thu nhỏ (mặc định 1)
 */
const ChordDiagram = (props) => {
  const {
    chordName,
    positions: positionsProp,
    barre: barreProp,
    startFret: startFretProp,
    name: nameProp,
    hideName = false,
    scale = 1,
    className = "",
  } = props;

  const { data, loading, error } = useChordShape(
    positionsProp ? null : chordName
  );

  const shape = React.useMemo(() => {
    if (positionsProp) {
      return {
        name: nameProp ?? chordName ?? "",
        positions: positionsProp,
        barre: barreProp || null,
        startFret: startFretProp ?? 1,
      };
    }
    if (data) {
      return {
        name: data.name ?? chordName ?? "",
        positions: data.positions ?? [],
        barre: data.barre ?? null,
        startFret: data.startFret ?? 1,
      };
    }
    return null;
  }, [positionsProp, barreProp, startFretProp, nameProp, chordName, data]);

  // Base layout
  const strings = 6;
  const frets = 4;
  const BASE_W = 60;
  const BASE_H = 80;
  const BASE_PAD_X = 5;
  const BASE_PAD_Y = 10;
  const DOT_R = 7; // dot radius
  const NUT_H = 4; // nut thickness
  const FRET_H = 2; // fret thickness
  const STRING_W = 2; // string line width
  const FONT_DOT = 10;
  const FONT_XO = 11;
  const FONT_SF = 10; // startFret font

  // Scale everything
  const width = BASE_W * scale;
  const height = BASE_H * scale;
  const padX = BASE_PAD_X * scale;
  const padY = BASE_PAD_Y * scale;
  const gridW = width - padX * 2;
  const gridH = height - padY * 2;

  const stringGap = gridW / (strings - 1);
  const fretGap = gridH / frets;

  const xForString = (stringNo) => padX + (stringNo - 1) * stringGap;
  const yForFretCenter = (fretIndex) =>
    padY + fretIndex * fretGap - fretGap / 2;

  if (!shape) {
    if (loading)
      return (
        <div className="ml-2 text-xs text-slate-500">Đang tải hợp âm…</div>
      );
    if (error)
      return (
        <div className="ml-2 text-xs text-red-600">
          Lỗi tải hợp âm: {String(error.message || error)}
        </div>
      );
    return null;
  }

  const { positions, barre, startFret = 1, name = chordName } = shape;

  const openOrMute = Array(strings).fill(null);
  const hasFretted = Array(strings).fill(false);
  positions?.forEach((p) => {
    if (typeof p.fret === "number" && p.fret > 0) {
      hasFretted[p.string - 1] = true;
    } else if (p.fret === 0 && !p.mute) {
      openOrMute[p.string - 1] = "o";
    }
    if (p.mute) openOrMute[p.string - 1] = "x";
  });

  const showNut = startFret === 1;

  return (
    <div className={`chord-diagram ml-2 ${className}`}>
      {!hideName && (
        <div
          className="text-xs font-bold text-center mb-1"
          style={{ transform: `scale(${scale})`, transformOrigin: "left top" }}
        >
          {name}
        </div>
      )}

      <div
        className="relative"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Strings */}
        {Array.from({ length: strings }).map((_, i) => (
          <div
            key={`string-${i}`}
            className="absolute bg-gray-400"
            style={{
              left: `${xForString(i + 1)}px`,
              top: `${padY}px`,
              width: `${STRING_W * scale}px`,
              height: `${gridH}px`,
              transform: `translateX(-${(STRING_W * scale) / 2}px)`,
              borderRadius: `${(STRING_W * scale) / 2}px`,
            }}
          />
        ))}

        {/* Frets */}
        {Array.from({ length: frets + 1 }).map((_, i) => {
          const thick = i === 0 && showNut ? NUT_H * scale : FRET_H * scale;
          const offset = i === 0 && showNut ? thick / -2 : thick / -2;
          return (
            <div
              key={`fret-${i}`}
              className="absolute bg-gray-800"
              style={{
                top: `${padY + i * fretGap}px`,
                left: `${padX}px`,
                width: `${gridW}px`,
                height: `${thick}px`,
                transform: `translateY(${offset}px)`,
                borderRadius: `${Math.max(1, thick / 2)}px`,
                opacity: i === 0 && showNut ? 1 : 0.8,
              }}
            />
          );
        })}

        {/* Barre */}
        {barre &&
          typeof barre.fret === "number" &&
          (() => {
            const fretIndex = barre.fret - startFret + 1;
            if (fretIndex < 0 || fretIndex > frets) return null;
            const y = yForFretCenter(fretIndex);
            const x1 = xForString(barre.from_string);
            const x2 = xForString(barre.to_string);
            const left = Math.min(x1, x2) - DOT_R * scale;
            const widthRect = Math.abs(x2 - x1) + DOT_R * 2 * scale;
            return (
              <div
                key="barre"
                className="absolute bg-gray-900 rounded-full"
                style={{
                  top: `${y - DOT_R * scale}px`,
                  left: `${left}px`,
                  width: `${widthRect}px`,
                  height: `${DOT_R * 2 * scale}px`,
                  opacity: 0.9,
                }}
              />
            );
          })()}

        {/* Dots */}
        {positions?.map((p, idx) => {
          if (typeof p.fret !== "number" || p.fret <= 0) return null;
          const fretIndex = p.fret - startFret + 1;
          if (fretIndex < 0 || fretIndex > frets) return null;
          const x = xForString(p.string);
          const y = yForFretCenter(fretIndex);
          return (
            <div
              key={`pos-${idx}`}
              className="absolute bg-blue-600 rounded-full flex items-center justify-center text-white"
              style={{
                left: `${x - DOT_R * scale}px`,
                top: `${y - DOT_R * scale}px`,
                width: `${DOT_R * 2 * scale}px`,
                height: `${DOT_R * 2 * scale}px`,
                fontSize: `${FONT_DOT * scale}px`,
                lineHeight: `${DOT_R * 2 * scale}px`,
              }}
              title={p.finger ? `Ngón ${p.finger}` : undefined}
            >
              {p.finger ?? ""}
            </div>
          );
        })}

        {/* X / O */}
        {Array.from({ length: strings }).map((_, i) => {
          if (hasFretted[i]) return null;
          const flag = openOrMute[i];
          if (!flag) return null;
          const x = xForString(i + 1);
          return (
            <div
              key={`xo-${i}`}
              className="absolute font-bold"
              style={{
                left: `${x - 4 * scale}px`,
                top: `${padY - 12 * scale}px`,
                fontSize: `${FONT_XO * scale}px`,
              }}
            >
              {flag === "o" ? "○" : "×"}
            </div>
          );
        })}

        {/* startFret */}
        {startFret !== 1 && (
          <div
            className="absolute text-slate-500"
            style={{
              left: `${padX + gridW + 4 * scale}px`,
              top: `${padY + fretGap - 7 * scale}px`,
              fontSize: `${FONT_SF * scale}px`,
            }}
          >
            {startFret}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChordDiagram;
