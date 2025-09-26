import React from "react";
import NoteDot from "./NoteDot";

const FretboardGrid = ({
  frets,
  strings,
  notes,
  selectedNotes,
  onNoteClick,
  stringWidths,
  bassNote,
}) => {
  const fretWidth = 34;
  const stringSpacing = 22;
  const topMargin = 18;
  const totalHeight = stringSpacing * (strings - 1) + 40;

  return (
    <div
      className="relative ml-10 rounded-lg border shadow-sm bg-white dark:bg-black border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200"
      style={{ width: `${fretWidth * frets}px`, height: `${totalHeight}px` }}
    >
      {/* Vạch ngăn phím (nut dày, còn lại mảnh, bo linecap nhẹ) */}
      {[...Array(frets + 1)].map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{
            left: `${i * fretWidth}px`,
            width: i === 0 ? "4px" : "1.5px",
            backgroundColor: "currentColor",
            opacity: i === 0 ? 1 : 0.65,
            borderRadius: "1px",
          }}
        />
      ))}

      {/* Dây đàn + nốt */}
      {[...Array(strings)].map((_, sIndex) => {
        const y = topMargin + sIndex * stringSpacing;
        const isThickString = sIndex < strings - 3;
        const thickness = Math.max(1, (stringWidths?.[sIndex] ?? 2) - 1);

        return (
          <React.Fragment key={sIndex}>
            {/* Dây: dây trầm đặc; dây treble 2 nét chấm mảnh (dotted) */}
            {isThickString ? (
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${y}px`,
                  height: `${Math.max(1, thickness)}px`,
                  backgroundColor: "currentColor",
                  opacity: 0.95,
                }}
              />
            ) : (
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${y}px`,
                  height: `${Math.max(1, thickness)}px`,
                  backgroundColor: "transparent",
                  // dùng currentColor để auto sync light/dark
                  borderTop: "1px dotted currentColor",
                  borderBottom: "1px dotted currentColor",
                  opacity: 0.5,
                }}
              />
            )}

            {[...Array(frets + 1)].map((_, fIndex) => {
              const noteData = notes[sIndex][fIndex];
              const isSelected = selectedNotes[sIndex]?.fret === fIndex;
              const isBassNote =
                bassNote &&
                isSelected &&
                noteData?.stringNumber === bassNote.stringNumber;

              return (
                <NoteDot
                  key={`${sIndex}-${fIndex}`}
                  stringIndex={sIndex}
                  fret={fIndex}
                  note={noteData.note}
                  isSharp={noteData.isSharp}
                  selected={isSelected}
                  isBassNote={isBassNote}
                  onClick={onNoteClick}
                  position={{
                    left: fIndex === 0 ? -20 : (fIndex - 0.5) * fretWidth,
                    top: y,
                  }}
                  dotSize={6}
                  selectedNotes={selectedNotes}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FretboardGrid;
