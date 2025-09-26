import React from "react";
import { useTuning } from "../../context/TuningContext";
import { useTuningAndNotes } from "../fretboard/hooks/useTuningAndNotes";
import NoteSummaryPanel from "../../components/Analyzes/NoteSummaryPanel";

const AnalyzerPanel = () => {
  const { currentTuning } = useTuning();
  const { selectedNotes, getBassNote } = useTuningAndNotes();

  // Lọc ra các nốt đang được chọn
  const activeNotes = selectedNotes
    .filter((note) => note.note !== null)
    .map((note) => ({
      ...note,
      noteName: note.isSharp ? `${note.note}#` : note.note,
    }));

  const bassNote = getBassNote();


  // Phân tích hợp âm/chord
  const analyzeChord = () => {
    if (activeNotes.length < 2) return "Not enough notes selected";

    const noteNames = activeNotes.map((n) =>
      n.isSharp ? `${n.note}#` : n.note
    );

    // Đơn giản: trả về danh sách các nốt
    return noteNames.join(" - ");
  };

  // Phân tích scale
  const analyzeScale = () => {
    // Logic phân tích scale sẽ được thêm sau
    return "Scale analysis will be implemented soon";
  };

  return (
    <div className="analyzer-panel bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
        Chord Analyzer
      </h2>

      <div className="space-y-4">
        <div className="analysis-section">
          <h3 className="font-semibold text-black dark:text-gray-300">
            Selected Notes
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {activeNotes.length > 0 ? (
              activeNotes.map((note, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full ${
                    note.stringNumber === bassNote?.stringNumber
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {note.isSharp ? `${note.note}#` : note.note}
                </span>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No notes selected
              </p>
            )}
          </div>
        </div>

        <div className="analysis-section">
          <h3 className="font-semibold text-black dark:text-gray-300">
            Chord Analysis
          </h3>
          <p className="mt-2 text-black dark:text-white">{analyzeChord()}</p>
        </div>

        <div className="analysis-section">
          <h3 className="font-semibold text-black dark:text-gray-300">
            Bass Note
          </h3>
          <p className="mt-2 text-black dark:text-white">
            {bassNote
              ? `${bassNote.isSharp ? `${bassNote.note}#` : bassNote.note}`
              : "None"}
          </p>
        </div>
        <ChordSuggestion selectedNotes={activeNotes} />
        <NoteSummaryPanel notes={activeNotes} tuning={currentTuning?.tuning} />
      </div>
    </div>
  );
};

export default AnalyzerPanel;
