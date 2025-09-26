import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TuningContext = createContext();

export const TuningProvider = ({ children, initialTuning = "Standard" }) => {
  const [tunings, setTunings] = useState([]);
  const [currentTuning, setCurrentTuning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTunings = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/strings");
        setTunings(res.data);
        const defaultTuning =
          res.data.find((t) => t.name === initialTuning) || res.data[0];
        if (defaultTuning) setCurrentTuning(defaultTuning);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch tunings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTunings();
  }, [initialTuning]);

  const updateTuning = (tuningId) => {
    const selected = tunings.find((t) => t._id === tuningId);
    if (selected) setCurrentTuning(selected);
  };

  return (
    <TuningContext.Provider
      value={{
        tunings,
        currentTuning,
        loading,
        error,
        updateTuning,
      }}
    >
      {children}
    </TuningContext.Provider>
  );
};

export const useTuning = () => {
  const context = useContext(TuningContext);
  if (!context) {
    throw new Error("useTuning must be used within a TuningProvider");
  }
  return context;
};
