import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Metronome.jsx — Plain React + WebAudio (no TypeScript)
 * Features:
 *  - Start/Stop (Space), Tap tempo (T)
 *  - BPM input + +/- nudge, Time signature, Subdivisions, Swing
 *  - Volume, Sound type (beep/wood)
 *  - Visual bar indicator with accented downbeat
 * Usage: export default; import Metronome from "./Metronome";
 */
export default function Metronome({ className = "" }) {
  // -------- UI state --------
  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [subdivision, setSubdivision] = useState("quarter"); // 'quarter'|'eighth'|'triplet'|'sixteenth'
  const [swing, setSwing] = useState(0); // 0..66
  const [volume, setVolume] = useState(0.7); // 0..1
  const [sound, setSound] = useState("beep"); // 'beep'|'wood'

  // Visual
  const [currentStep, setCurrentStep] = useState(0);
  const [barCounter, setBarCounter] = useState(0);

  // -------- Audio & scheduler refs --------
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const lookaheadRef = useRef(undefined); // setInterval id
  const nextNoteTimeRef = useRef(0); // AudioContext time of next note
  const stepRef = useRef(0);
  const tapsRef = useRef([]);

  // Derived
  const stepsPerBeat = useMemo(() => {
    switch (subdivision) {
      case "quarter":
        return 1;
      case "eighth":
        return 2;
      case "triplet":
        return 3;
      case "sixteenth":
        return 4;
      default:
        return 1;
    }
  }, [subdivision]);

  const stepsPerBar = useMemo(
    () => beatsPerBar * stepsPerBeat,
    [beatsPerBar, stepsPerBeat]
  );
  const secondsPerBeat = useMemo(
    () => 60 / Math.max(20, Math.min(400, bpm)),
    [bpm]
  );

  function scheduleClick(when, stepIndex) {
    if (!audioCtxRef.current || !gainRef.current) return;
    const ctx = audioCtxRef.current;

    const isDownbeat = stepIndex % stepsPerBar === 0;
    const isBeat = stepIndex % stepsPerBeat === 0;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    osc.connect(gain);
    gain.connect(gainRef.current);

    const high = sound === "beep" ? 1600 : 900; // accent
    const mid = sound === "beep" ? 1150 : 750; // beat
    const low = sound === "beep" ? 800 : 600; // sub
    const freq = isDownbeat ? high : isBeat ? mid : low;

    osc.type = sound === "wood" ? "square" : "sine";
    osc.frequency.setValueAtTime(freq, when);

    const a = 0.001; // attack
    const d = isDownbeat ? 0.08 : isBeat ? 0.06 : 0.04; // decay
    const vol = (isDownbeat ? 1.0 : isBeat ? 0.8 : 0.6) * volume;

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(vol, when + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + d);

    osc.start(when);
    osc.stop(when + d + 0.02);
  }

  function nextStepTime(prevTime, stepIndex) {
    let stepDur = secondsPerBeat / stepsPerBeat;
    if (subdivision === "eighth" && swing > 0) {
      const isOff = stepIndex % 2 === 1; // off-beat
      const swingRatio = 1 + (swing / 100) * 0.66; // up to ~1.44
      stepDur = isOff ? stepDur * swingRatio : stepDur * (2 - swingRatio);
    }
    return prevTime + stepDur;
  }

  function scheduler() {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const scheduleAheadTime = 0.15; // seconds
    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      // schedule sound
      scheduleClick(nextNoteTimeRef.current, stepRef.current);

      // schedule visual update aligned to audio time
      const localStepIndex = stepRef.current;
      const fireInMs = Math.max(
        0,
        (nextNoteTimeRef.current - ctx.currentTime) * 1000
      );
      window.setTimeout(() => {
        setCurrentStep(localStepIndex % stepsPerBar);
        if (localStepIndex % stepsPerBar === 0 && localStepIndex !== 0)
          setBarCounter((n) => n + 1);
      }, fireInMs);

      // advance
      nextNoteTimeRef.current = nextStepTime(
        nextNoteTimeRef.current,
        stepRef.current
      );
      stepRef.current += 1;
    }
  }

  function start() {
    if (isRunning) return;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new Ctx();
      const master = audioCtxRef.current.createGain();
      master.gain.value = volume;
      master.connect(audioCtxRef.current.destination);
      gainRef.current = master;
    }
    const ctx = audioCtxRef.current;
    stepRef.current = 0;
    setCurrentStep(0);
    setBarCounter(0);
    const startAt = ctx.currentTime + 0.05; // short preroll
    nextNoteTimeRef.current = startAt;
    setIsRunning(true);
    lookaheadRef.current = window.setInterval(scheduler, 25);
  }

  function stop() {
    setIsRunning(false);
    if (lookaheadRef.current) window.clearInterval(lookaheadRef.current);
    lookaheadRef.current = undefined;
    stepRef.current = 0;
    setCurrentStep(0);
  }

  // Shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        isRunning ? stop() : start();
      }
      if ((e.key || "").toLowerCase() === "t") {
        handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning]);

  // Live volume
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  // Cleanup
  useEffect(
    () => () => {
      if (lookaheadRef.current) window.clearInterval(lookaheadRef.current);
    },
    []
  );

  // Tap tempo
  function handleTap() {
    const now = performance.now();
    tapsRef.current = tapsRef.current.filter((t) => now - t < 2500);
    tapsRef.current.push(now);
    if (tapsRef.current.length >= 2) {
      const intervals = tapsRef.current
        .slice(1)
        .map((t, i) => t - tapsRef.current[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calcBpm = Math.max(20, Math.min(400, Math.round(60000 / avg)));
      setBpm(calcBpm);
    }
  }

  function changeBpm(delta) {
    setBpm((b) => Math.max(20, Math.min(400, b + delta)));
  }

  const steps = Array.from({ length: stepsPerBar }, (_, i) => i);

  return (
    <div
      className={`rounded-2xl shadow-lg p-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur ${className}`}
    >
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Metronome</h2>
          <p className="text-sm opacity-70">Space: Start/Stop • T: Tap</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (isRunning ? stop() : start())}
            className={`px-4 py-2 rounded-xl font-semibold shadow ${
              isRunning ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
            }`}
          >
            {isRunning ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 shadow-inner">
          <label className="text-sm font-medium">BPM</label>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => changeBpm(-5)}
              className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700"
            >
              -5
            </button>
            <button
              onClick={() => changeBpm(-1)}
              className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700"
            >
              -1
            </button>
            <input
              type="number"
              className="w-24 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
            <button
              onClick={() => changeBpm(1)}
              className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700"
            >
              +1
            </button>
            <button
              onClick={() => changeBpm(5)}
              className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700"
            >
              +5
            </button>
            <button
              onClick={handleTap}
              className="px-3 py-2 rounded-lg bg-blue-500 text-white"
            >
              Tap
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 shadow-inner">
          <label className="text-sm font-medium">Time Signature</label>
          <div className="mt-2 flex items-center gap-2">
            <select
              className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700"
              value={beatsPerBar}
              onChange={(e) => setBeatsPerBar(parseInt(e.target.value))}
            >
              {[2, 3, 4, 5, 6, 7, 9, 12].map((n) => (
                <option key={n} value={n}>
                  {n}/4
                </option>
              ))}
            </select>
            <span className="text-sm opacity-60">Accent on 1</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 shadow-inner">
          <label className="text-sm font-medium">Subdivision</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {["quarter", "eighth", "triplet", "sixteenth"].map((opt) => (
              <button
                key={opt}
                onClick={() => setSubdivision(opt)}
                className={`px-3 py-2 rounded-lg ${
                  subdivision === opt
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {subdivision === "eighth" && (
            <div className="mt-3">
              <label className="text-sm font-medium">Swing %</label>
              <input
                type="range"
                min={0}
                max={66}
                value={swing}
                onChange={(e) => setSwing(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs opacity-70">{swing}%</div>
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 shadow-inner">
          <label className="text-sm font-medium">Sound & Volume</label>
          <div className="mt-2 flex items-center gap-2">
            <select
              className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700"
              value={sound}
              onChange={(e) => setSound(e.target.value)}
            >
              <option value="beep">Beep</option>
              <option value="wood">Wood</option>
            </select>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Visual bar */}
      <div className="mt-6">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${stepsPerBar}, minmax(0,1fr))`,
          }}
        >
          {steps.map((i) => {
            const isBeat = i % stepsPerBeat === 0;
            const isActive = i === currentStep;
            const isDownbeat = i === 0;
            return (
              <div
                key={i}
                className={`h-10 mx-1 rounded-xl transition-all ${
                  isActive ? "scale-105" : "opacity-70"
                } ${
                  isDownbeat
                    ? "bg-emerald-500"
                    : isBeat
                    ? "bg-blue-500"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              ></div>
            );
          })}
        </div>
        <div className="mt-2 text-xs opacity-70">Bar: {barCounter + 1}</div>
      </div>

      <div className="mt-4 text-xs opacity-70">
        <p>
          Low‑latency scheduler: setInterval lookahead (25ms) + WebAudio clock.
          Works offline in PWA.
        </p>
      </div>
    </div>
  );
}
