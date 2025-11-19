import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Fretboard from "../../fretboard/fretboard";
import ChordDiagram from "../../Analyzer/components/ChordDiagram";
import ExplainChord from "../components/ExplainChord";
// import { useNavigate } from "react-router-dom"; // KHÔNG cần nữa vì đã tắt click

// Helper chặn mọi tương tác card (capture phase để không bubble lên cha)
const stopAllClicks = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const ChordResult = () => {
  // const navigate = useNavigate(); // bỏ dùng
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [suggestedChords, setSuggestedChords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(3);

  // ====== PHẦN AUDIO của bạn giữ nguyên ======
  const [audioContext, setAudioContext] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const sampleBuffers = useRef({});
  const activeSources = useRef([]);

  // Đổi # -> b (để khớp thư mục audio)
  const convertSharpToFlat = (noteName) => {
    const sharpToFlatMap = {
      "C#": "Db",
      "D#": "Eb",
      "F#": "Gb",
      "G#": "Ab",
      "A#": "Bb",
    };
    const m = noteName.match(/^([A-G]#?)(\d+)$/);
    if (!m) return noteName;
    const original = m[1];
    const octave = m[2];
    return sharpToFlatMap[original]
      ? `${sharpToFlatMap[original]}${octave}`
      : noteName;
  };

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);

    const preloadSamples = async () => {
      const commonNotes = [
        "A0",
        "Bb0",
        "B0",
        "C1",
        "Db1",
        "D1",
        "Eb1",
        "E1",
        "F1",
        "Gb1",
        "G1",
        "Ab1",
        "A1",
        "Bb1",
        "B1",
        "C2",
        "Db2",
        "D2",
        "Eb2",
        "E2",
        "F2",
        "Gb2",
        "G2",
        "Ab2",
        "A2",
        "Bb2",
        "B2",
        "C3",
        "Db3",
        "D3",
        "Eb3",
        "E3",
        "F3",
        "Gb3",
        "G3",
        "Ab3",
        "A3",
        "Bb3",
        "B3",
        "C4",
      ];
      await Promise.all(commonNotes.map((n) => loadSample(n)));
    };

    preloadSamples();

    return () => {
      cleanupActiveSources();
      if (ctx.state !== "closed") ctx.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeNotes = selectedNotes
    .filter((note) => note.note !== null)
    .sort((a, b) => b.stringNumber - a.stringNumber);

  const cleanupActiveSources = () => {
    activeSources.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        console.warn("Error cleaning up audio source:", e);
      }
    });
    activeSources.current = [];
  };

  const loadSample = async (noteName) => {
    if (sampleBuffers.current[noteName]) return sampleBuffers.current[noteName];
    try {
      const response = await fetch(`/audio/guitar/${noteName}.mp3`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      sampleBuffers.current[noteName] = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error("Error loading sample:", error);
      throw error;
    }
  };

  const playSample = async (noteName, timeOffset = 0) => {
    try {
      if (!audioContext) return;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const normalized = convertSharpToFlat(noteName);
      const buffer = await loadSample(normalized);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      activeSources.current.push(source);
      source.onended = () => {
        activeSources.current = activeSources.current.filter(
          (s) => s !== source
        );
      };
      source.start(audioContext.currentTime + timeOffset);
    } catch (error) {
      console.error("Error playing sample:", error);
    }
  };

  const stopAll = () => {
    cleanupActiveSources();
    setIsPlaying(false);
  };

  const getNoteNameWithOctave = (note, isSharp, octave) =>
    `${note}${isSharp ? "#" : ""}${octave}`;

  const playChord = async () => {
    if (!audioContext || activeNotes.length === 0 || isPlaying) return;
    setIsPlaying(true);
    cleanupActiveSources();
    try {
      await Promise.all(
        activeNotes.map((note, idx) => {
          const noteName = getNoteNameWithOctave(
            note.note,
            note.isSharp,
            note.octave || 3
          );
          return playSample(noteName, idx * 0.02);
        })
      );
    } finally {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  const arpeggiateChord = async () => {
    if (!audioContext || activeNotes.length === 0 || isPlaying) return;
    setIsPlaying(true);
    cleanupActiveSources();
    try {
      for (let i = 0; i < activeNotes.length; i++) {
        const n = activeNotes[i];
        const noteName = getNoteNameWithOctave(
          n.note,
          n.isSharp,
          n.octave || 3
        );
        await playSample(noteName, i * 0.4);
        await new Promise((r) => setTimeout(r, 10));
      }
    } finally {
      setTimeout(() => setIsPlaying(false), activeNotes.length * 400);
    }
  };

  // ====== GỢI Ý HỢP ÂM ======
  const fetchSuggestedChords = async () => {
    if (activeNotes.length < 2) {
      setSuggestedChords([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const noteNames = activeNotes.map((n) =>
        n.isSharp ? `${n.note}#` : n.note
      );
      const response = await axios.get(
        "http://localhost:3000/api/chords/suggest",
        {
          params: { notes: noteNames.join(",") },
        }
      );
      if (response.data.success) {
        setSuggestedChords(response.data.chords || []);
        setDisplayLimit(3);
      } else {
        setError(response.data.message || "Failed to get suggestions");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedChords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNotes]);

  const showMoreChords = () => setDisplayLimit((prev) => prev + 3);

  const getMatchTypeLabel = (matchType) => {
    switch (matchType) {
      case "exact":
        return "Khớp chính xác";
      case "containsAll":
        return "Chứa tất cả nốt";
      case "partial":
        return "Gợi ý tương tự";
      case "bassMatch":
        return "Khớp bass";
      default:
        return "";
    }
  };

  return (
    <div className="flex w-full h-screen p-4 gap-4 bg-gradient-to-br from-gray-100 to-white dark:from-slate-900 dark:to-slate-950">
      {/* CỘT TRÁI: CẦN ĐÀN + GỢI Ý */}
      <div className="flex-[2] min-w-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Cần đàn
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedNotes([])}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
            >
              Xóa nốt
            </button>
            {/* <button
              type="button"
              onClick={stopAll}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm"
            >
              Dừng
            </button> */}
          </div>
        </div>

        {/* Vùng cần đàn */}
        <div className="p-4">
          <div className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
            <Fretboard
              onNotesChange={setSelectedNotes}
              showAnalyzerPanel={false}
            />
          </div>

          {/* Gợi ý hợp âm */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Hợp âm gợi ý
              </h3>
              {suggestedChords.length > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {suggestedChords.length} kết quả
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-10 grid place-items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-transparent dark:border-slate-600" />
              </div>
            ) : error ? (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
                {error}
              </div>
            ) : suggestedChords.length > 0 ? (
              <>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {suggestedChords
                    .slice(0, displayLimit)
                    .map((chord, index) => (
                      <div
                        key={index}
                        className="
                        p-3 rounded-lg border border-slate-200 dark:border-slate-700
                        bg-white dark:bg-slate-900
                        select-none cursor-default
                      "
                        
                        onClickCapture={stopAllClicks}
                        onMouseDownCapture={stopAllClicks}
                        onPointerDownCapture={stopAllClicks}
                        onTouchStartCapture={stopAllClicks}
                        onKeyDownCapture={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            stopAllClicks(e);
                        }}
                        tabIndex={-1}
                        role="presentation"
                        aria-disabled="true"
                        style={{ userSelect: "none" }}
                      >
                        <div className="flex items-start gap-3">
                          {/* THẾ BẤM to hơn, không hiện tên trên diagram */}
                          {/* <div className="w-[110px] h-[150px] flex-shrink-0 flex items-center justify-center">
                            <ChordDiagram
                              name={chord.name}
                              positions={
                                chord.positions ||
                                chord.shapes?.[0]?.positions ||
                                []
                              }
                              barre={chord.barre || chord.shapes?.[0]?.barre}
                              startFret={
                                chord.startFret ??
                                chord.shapes?.[0]?.startFret ??
                                1
                              }
                              hideName={true}
                              scale={1.6}
                            />
                          </div> */}

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {chord.name}
                              </h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  chord.difficulty === "easy"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                    : chord.difficulty === "medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                                }`}
                              >
                                {chord.difficulty}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                              {chord.notes.join(", ")}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-1">
                              {chord.matchType && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {getMatchTypeLabel(chord.matchType)}
                                </span>
                              )}
                              {chord.bass && (
                                <span className="text-[11px] text-indigo-600 dark:text-indigo-300">
                                  Bass: {chord.bass}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {displayLimit < suggestedChords.length && (
                  <button
                    onClick={showMoreChords}
                    className="mt-4 mx-auto block px-4 py-2 rounded-md border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 transition"
                  >
                    Hiển thị thêm{" "}
                    {Math.min(3, suggestedChords.length - displayLimit)} hợp âm
                  </button>
                )}
              </>
            ) : (
              <div className="py-10 grid place-items-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                  {activeNotes.length > 1
                    ? "Không tìm thấy hợp âm phù hợp"
                    : "Chọn ít nhất 2 nốt để nhận gợi ý"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: Điều khiển + ExplainChord */}
      <div className="flex-1 min-w-[280px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            Điều khiển
          </h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={playChord}
              disabled={activeNotes.length === 0 || isPlaying}
              className={`w-full px-4 py-3 rounded-lg transition relative overflow-hidden ${
                activeNotes.length === 0 || isPlaying
                  ? "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isPlaying && (
                <div className="absolute inset-0 bg-blue-400/40 dark:bg-blue-300/20 animate-pulse" />
              )}
              <span className="relative z-10">Chơi hợp âm (tất cả nốt)</span>
            </button>

            <button
              type="button"
              onClick={arpeggiateChord}
              disabled={activeNotes.length === 0 || isPlaying}
              className={`w-full px-4 py-3 rounded-lg transition relative overflow-hidden ${
                activeNotes.length === 0 || isPlaying
                  ? "bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {isPlaying && (
                <div className="absolute inset-0 bg-purple-400/40 dark:bg-purple-300/20 animate-pulse" />
              )}
              <span className="relative z-10">Rải hợp âm (từng nốt)</span>
            </button>

            <button
              type="button"
              onClick={stopAll}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              Dừng phát
            </button>
          </div>
        </div>

        <ExplainChord
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3"
          notes={selectedNotes}
          bassAsRoot
          renderFancy
          onAnalyzed={() => {}}
        />
      </div>
    </div>
  );
};

export default ChordResult;
