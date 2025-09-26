import { useState, useEffect } from "react";
import axios from "axios";
import { useTuning } from "../../../context/TuningContext";

const createEmptyNotes = (strings, frets) => {
  return Array.from({ length: strings }, () =>
    Array.from({ length: frets + 1 }, () => ({
      note: "",
      isSharp: false,
      stringNumber: null,
    }))
  );
};

export const useTuningAndNotes = (frets = 15, strings = 6) => {
  const { currentTuning } = useTuning();
  const [notes, setNotes] = useState(createEmptyNotes(strings, frets));
  const [selectedNotes, setSelectedNotes] = useState(
    Array(strings)
      .fill()
      .map(() => ({
        fret: null,
        note: null,
        isSharp: false,
        stringNumber: null,
      }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentTuning) return;

    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:3000/api/notes/${currentTuning._id}`
        );

        const formatted = createEmptyNotes(strings, frets);

        for (let stringNum = 1; stringNum <= strings; stringNum++) {
          const stringNotes = res.data[stringNum] || [];
          stringNotes.forEach(({ fret, note, isSharp, stringNumber }) => {
            if (fret >= 0 && fret <= frets) {
              formatted[stringNum - 1][fret] = {
                note: note || "",
                isSharp: isSharp || false,
                stringNumber: stringNumber || stringNum,
              };
            }
          });
        }

        setNotes(formatted);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching notes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [currentTuning, frets, strings]);

  const getBassNote = () => {
    const activeNotes = selectedNotes.filter((note) => note.note !== null);
    if (activeNotes.length === 0) return null;
    return activeNotes.reduce((max, note) =>
      note.stringNumber > max.stringNumber ? note : max
    );
  };

  const handleNoteClick = (stringIndex, fret) => {
    const newSelected = [...selectedNotes];
    const clickedNote = notes[stringIndex][fret];

    newSelected[stringIndex] =
      newSelected[stringIndex].fret === fret
        ? { fret: null, note: null, isSharp: false, stringNumber: null }
        : {
            fret,
            note: clickedNote.note,
            isSharp: clickedNote.isSharp,
            stringNumber: clickedNote.stringNumber,
          };

    setSelectedNotes(newSelected);
  };

  return {
    notes,
    selectedNotes,
    loading,
    error,
    handleNoteClick,
    getBassNote,
  };
};
