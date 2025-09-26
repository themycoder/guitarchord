import React from "react";
import ChordOptions from "../../Features/Chord-library/components/ChordOptions";
import { TuningProvider } from "../../context/TuningContext";
import { SelectedNotesProvider } from "../../context/SelectedNotesContext";
const ChordLibrary = () => {
  return (
    <TuningProvider>
      <SelectedNotesProvider>
        <div className="min-h-screen flex flex-col md:flex-row w-full p-4 gap-4 bg-gray-50 dark:bg-gray-800">
          {/* Left: Chord Info */}
          <div className="w-full md:w-full bg-white dark:bg-gray-900 p-4 rounded shadow flex-1">
            <ChordOptions />
          </div>
        </div>
      </SelectedNotesProvider>
    </TuningProvider>
  );
};

export default ChordLibrary;
