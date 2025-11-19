// src/features/analyzer/AnalyzerPanel.jsx
import React from "react";
import { useTuning } from "../../context/TuningContext";
import { useTuningAndNotes } from "../fretboard/hooks/useTuningAndNotes";
import NoteSummaryPanel from "../../components/Analyzes/NoteSummaryPanel";
import ChordSuggestion from "../../components/Analyzes/ChordSuggestion";

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

  // Phân tích hợp âm/chord (tạm thời: liệt kê nốt)
  const analyzeChord = () => {
    if (activeNotes.length < 2) return "Not enough notes selected";

    const noteNames = activeNotes.map((n) =>
      n.isSharp ? `${n.note}#` : n.note
    );

    return noteNames.join(" – ");
  };

  // Phân tích scale (placeholder)
  const analyzeScale = () => {
    return "Scale analysis will be implemented soon";
  };

  const tuningLabel =
    currentTuning?.displayName ||
    currentTuning?.tuning?.join(" • ") ||
    "Standard tuning";

  return (
    <div
      className="analyzer-panel rounded-3xl border border-[#D0E3FF] dark:border-[#1f2937]
                 bg-white/80 dark:bg-[#020617]/90 backdrop-blur
                 shadow-sm px-4 py-4 md:px-6 md:py-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[#061F5C] dark:text-[#F9FCFF]">
            Chord Analyzer
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            Chọn các nốt trên cần đàn để xem gợi ý hợp âm và thống kê nốt.
          </p>
        </div>

        <div className="inline-flex flex-col items-end gap-1 text-right">
          <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tuning
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#D0E3FF] dark:border-[#334EAC] bg-[#F9FCFF] dark:bg-[#061F5C]/70 px-3 py-1 text-xs font-medium text-[#061F5C] dark:text-[#F9FCFF]">
            {tuningLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-5">
        {/* Selected notes */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#061F5C] dark:text-[#F9FCFF]">
              Selected Notes
            </h3>
            <span className="text-[11px] rounded-full bg-[#D0E3FF]/60 dark:bg-[#061F5C]/70 px-2 py-0.5 text-[#061F5C] dark:text-[#F9FCFF] font-medium">
              {activeNotes.length} note
              {activeNotes.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1">
            {activeNotes.length > 0 ? (
              activeNotes.map((note, index) => {
                const isBass =
                  bassNote &&
                  note.stringNumber === bassNote.stringNumber &&
                  note.fret === bassNote.fret;

                return (
                  <span
                    key={index}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-sm border",
                      isBass
                        ? "bg-[#061F5C] text-[#F9FCFF] border-[#061F5C]"
                        : "bg-[#F9FCFF] text-[#061F5C] border-[#D0E3FF]",
                    ].join(" ")}
                  >
                    {note.isSharp ? `${note.note}#` : note.note}
                    {isBass && (
                      <span className="ml-1 text-[10px] font-normal opacity-90">
                        (bass)
                      </span>
                    )}
                  </span>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No notes selected
              </p>
            )}
          </div>
        </section>

        {/* Chord analysis */}
        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold text-[#061F5C] dark:text-[#F9FCFF]">
            Chord Analysis
          </h3>
          <div className="rounded-2xl border border-[#D0E3FF] dark:border-[#334EAC] bg-[#F9FCFF]/80 dark:bg-[#061F5C]/70 px-3 py-2.5 text-sm text-[#061F5C] dark:text-[#F9FCFF]">
            {analyzeChord()}
          </div>
        </section>

        {/* Bass + scale row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[#061F5C] dark:text-[#F9FCFF]">
              Bass Note
            </h3>
            <div className="rounded-2xl border border-[#D0E3FF] dark:border-[#334EAC] bg-white/80 dark:bg-[#020617] px-3 py-2 text-sm text-[#061F5C] dark:text-[#F9FCFF]">
              {bassNote
                ? bassNote.isSharp
                  ? `${bassNote.note}#`
                  : bassNote.note
                : "None"}
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[#061F5C] dark:text-[#F9FCFF]">
              Scale Analysis
            </h3>
            <div className="rounded-2xl border border-dashed border-[#D0E3FF]/80 dark:border-[#334EAC]/70 bg-[#F9FCFF]/60 dark:bg-[#020617] px-3 py-2 text-xs md:text-sm text-slate-600 dark:text-slate-300">
              {analyzeScale()}
            </div>
          </div>
        </section>

        {/* Gợi ý chord + thống kê nốt */}
        <section className="space-y-3">
          <ChordSuggestion selectedNotes={activeNotes} />
          <NoteSummaryPanel
            notes={activeNotes}
            tuning={currentTuning?.tuning}
          />
        </section>
      </div>
    </div>
  );
};

export default AnalyzerPanel;
