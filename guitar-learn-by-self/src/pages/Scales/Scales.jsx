import React from "react";


import { TuningProvider } from "../../context/TuningContext";
import { SelectedNotesProvider } from "../../context/SelectedNotesContext";
import ScaleDiagram from "../../Features/scale-display/components/ScaleDiagram";
const Scale = () => {
  return (
    <TuningProvider>
      <SelectedNotesProvider>
        <div className="min-h-screen flex flex-col md:flex-row w-full p-4 gap-4 bg-gray-50 dark:bg-gray-800">
          {/* Left: Chord Info */}
          <div className="w-full md:w-full bg-white dark:bg-gray-900 p-4 rounded shadow flex-1">
            <ScaleDiagram />
          </div>
        </div>
      </SelectedNotesProvider>
    </TuningProvider>
  );
};

export default Scale;
