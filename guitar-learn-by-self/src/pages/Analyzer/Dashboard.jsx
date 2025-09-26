import React from "react";

import ChordResult from "../../Features/Chord-finder/components/ChordResult";
import { TuningProvider } from "../../context/TuningContext";
import { SelectedNotesProvider } from "../../context/SelectedNotesContext";
const Analyzer = () => {
  return (
    <TuningProvider>
      <SelectedNotesProvider>
        <div className="min-h-screen flex flex-col md:flex-row w-full p-4 gap-4 bg-gray-50 dark:bg-gray-800">
          {/* Left: Chord Info */}
          <div className="w-full md:w-full bg-white dark:bg-gray-900 p-4 rounded shadow flex-1">
            <ChordResult />
          </div>
        </div>
      </SelectedNotesProvider>
    </TuningProvider>
  );
};

export default Analyzer;
