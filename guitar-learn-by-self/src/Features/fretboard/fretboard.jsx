import React, { useEffect } from "react";
import FretboardGrid from "../../components/Fretboard/FretboardGrid";
import TuningSelector from "../../components/Fretboard/TuningSelector";
import { useTuning } from "../../context/TuningContext";
import { useTuningAndNotes } from "../fretboard/hooks/useTuningAndNotes";

const Fretboard = ({
  frets = 15,
  strings = 6,
  showTuningSelector = true,
  showStringLabels = true,
  showAnalyzerPanel = false, // Mặc định tắt
  stringWidths = [1.0, 1.2, 1.6, 2.0, 2.5, 3.2],
  onNotesChange, // Thêm prop này
}) => {
  const {
    currentTuning,
    loading: tuningLoading,
    error: tuningError,
  } = useTuning();

  const {
    notes,
    selectedNotes,
    loading: notesLoading,
    error: notesError,
    handleNoteClick,
    getBassNote,
  } = useTuningAndNotes(frets, strings);

  // Thêm effect để gọi callback khi selectedNotes thay đổi
  useEffect(() => {
    if (onNotesChange) {
      onNotesChange(selectedNotes);
    }
  }, [selectedNotes, onNotesChange]);

  if (tuningLoading || notesLoading) return <div>Loading fretboard...</div>;
  if (tuningError) return <div>Error loading tunings: {tuningError}</div>;
  if (notesError) return <div>Error loading notes: {notesError}</div>;
  if (!currentTuning) return <div>No tuning selected</div>;

  return (
    <div className="fretboard-container w-full h-full">
      {showTuningSelector && <TuningSelector />}

      <div className="relative flex flex-row items-start gap-4 px-2 pb-8 w-full h-full">
        {/* Đã chuyển AnalyzerPanel ra ngoài */}
        <div className={`${showAnalyzerPanel ? "flex-1" : "w-full"}`}>
          <FretboardGrid
            frets={frets}
            strings={strings}
            notes={notes}
            selectedNotes={selectedNotes}
            onNoteClick={handleNoteClick}
            stringWidths={stringWidths}
            bassNote={getBassNote()}
          />
        </div>
      </div>
    </div>
  );
};

export default Fretboard;
