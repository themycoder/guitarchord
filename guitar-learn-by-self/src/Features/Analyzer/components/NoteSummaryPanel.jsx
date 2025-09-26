import React from "react";

const NoteSummaryPanel = ({ notes, tuning }) => {
  // Nhóm các nốt theo tên
  const noteCounts =
    notes?.reduce((acc, note) => {
      const noteName = note.isSharp ? `${note.note}#` : note.note;
      acc[noteName] = (acc[noteName] || 0) + 1;
      return acc;
    }, {}) || {};

  return (
    <div className="note-summary-panel mt-4">
      <h3 className="font-semibold text-black dark:text-gray-300">
        Note Summary
      </h3>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {Object.entries(noteCounts).map(([note, count]) => (
          <div key={note} className="flex items-center">
            <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mr-2">
              {note}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ×{count}
            </span>
          </div>
        ))}
      </div>

      {tuning && (
        <div className="mt-4">
          <h3 className="font-semibold text-black dark:text-gray-300">
            Current Tuning
          </h3>
          <p className="mt-2 text-black dark:text-white">
            {tuning.join(" - ")}
          </p>
        </div>
      )}
    </div>
  );
};

export default NoteSummaryPanel;
