export function normalizeNotes(rawNotes: string): string[] {
  const notesArray = rawNotes.split(",");
  const normalized = notesArray.map((note) => {
    return note.trim().toUpperCase().replace(/♯/g, "#").replace(/♭/g, "b");
  });
  return normalized.filter((note) => note);
}
