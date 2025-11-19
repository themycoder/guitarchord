import Chord from "../models/Chord.model";

export async function getChordByName(name: string) {
  return Chord.findOne({ name });
}

