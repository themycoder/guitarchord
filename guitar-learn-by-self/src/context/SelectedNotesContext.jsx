import React, { createContext, useContext, useState } from "react";

const SelectedNotesContext = createContext();

export const SelectedNotesProvider = ({ children }) => {
  const [selectedNotes, setSelectedNotes] = useState([]);

  return (
    <SelectedNotesContext.Provider value={{ selectedNotes, setSelectedNotes }}>
      {children}
    </SelectedNotesContext.Provider>
  );
};

export const useSelectedNotes = () => useContext(SelectedNotesContext);
