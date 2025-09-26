// NoteSummaryPanel.jsx
import React from "react";

const colorMap = {
  root: "bg-green-600 text-white",
  third: "bg-orange-400 text-white",
  fifth: "bg-blue-600 text-white",
  seventh: "bg-orange-600 text-white",
  extension: "border border-red-500 text-red-500",
};

const labelMap = {
  root: "Root (1)",
  third: "m3 / maj3",
  fifth: "no5 / 5",
  seventh: "b6 / 7th",
  extension: "b9 / #11 / 13",
};

const NoteSummaryPanel = ({ selectedNotes = [] }) => {
  return (
    <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded shadow w-full">
      <h2 className="text-lg font-semibold text-center mb-2">Chord Tones</h2>
      {selectedNotes.length === 0 ? (
        <div className="text-gray-400 text-center">No notes selected</div>
      ) : (
        selectedNotes.map((note, index) => {
          const color =
            colorMap[note.role] || "border border-gray-400 text-gray-700";
          return (
            <div
              key={index}
              className={`flex items-center justify-between px-3 py-1 rounded ${color}`}
            >
              <span className="font-bold">{note.name}</span>
              <span className="text-xs">
                {labelMap[note.role] || note.role}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

export default NoteSummaryPanel;
