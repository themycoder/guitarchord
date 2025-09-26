import React from "react";
import clsx from "clsx"; // dùng cho dễ gộp class điều kiện (npm install clsx nếu chưa có)

const NoteDot = ({
  stringIndex,
  fret,
  note,
  isSharp,
  selected,
  isBassNote,
  onClick,
  position,
  dotSize,
  selectedNotes,
}) => {
  const fullNote = isSharp ? `${note}#` : note;
  const isOtherFretSelectedOnSameString =
    selectedNotes?.[stringIndex]?.fret > 0;

  const displayText = selected
    ? fullNote
    : fret === 0 && !isOtherFretSelectedOnSameString
    ? "X"
    : "";

  const baseClass = clsx(
    "absolute flex items-center justify-center",
    "w-[18px] h-[18px] text-[12px] font-bold",
    "transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer",
    {
      "rounded-[4px] bg-red-600 dark:bg-blue-400 text-white scale-110 shadow-md shadow-red-400 dark:shadow-blue-400 z-[2]":
        isBassNote,
      "rounded-full bg-blue-500 dark:bg-gray-400 text-white dark:text-blue-100":
        !isBassNote && selected,
      "rounded-full text-red-500 dark:text-blue-300":
        !isBassNote && !selected && fret === 0,
    }
  );

  return (
    <div
      onClick={() => onClick(stringIndex, fret)}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
      className={baseClass}
      title={isBassNote ? `${fullNote} (Bass)` : fullNote}
    >
      {displayText}
      {isBassNote && (
        <span className="absolute -bottom-[11px] text-[8px] text-yellow-500 dark:text-white">
          Bass
        </span>
      )}
    </div>
  );
};

export default NoteDot;
