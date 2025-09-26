// fretboard/components/TuningSelector.jsx
import React from "react";
import { useTuning } from "../../context/TuningContext";

const TuningSelector = () => {
  const { tunings, currentTuning, setCurrentTuning } = useTuning();

  return (
    <div className="mb-5 text-black dark:text-white">
      <label htmlFor="tuning-select" className="mr-2 dark:text-white">
        Chọn tuning:
      </label>
      <select
        id="tuning-select"
        value={currentTuning?._id || ""}
        onChange={(e) => {
          const selected = tunings.find((t) => t._id === e.target.value);
          setCurrentTuning(selected);
        }}
        className="px-2 py-1 rounded bg-white dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
      >
        {tunings.map((tuning) => (
          <option key={tuning._id} value={tuning._id}>
            {tuning.name} ({tuning.tuning.join("-")})
          </option>
        ))}
      </select>
    </div>
  );
};

export default TuningSelector;
