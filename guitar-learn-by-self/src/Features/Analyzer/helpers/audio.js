// src/helpers/audio.js
// Không có TypeScript, chỉ dùng JS thuần cho chắc chắn.

let _ctx = null;

export function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;

  // Reuse nếu đã có context, nếu bị closed thì tạo mới
  if (!_ctx || _ctx.state === "closed") {
    try {
      _ctx = new Ctx();
    } catch (e) {
      console.error("Cannot create AudioContext:", e);
      _ctx = null;
    }
  }
  return _ctx;
}

export async function ensureAudioContextUnlocked() {
  const ctx = getAudioContext();
  if (!ctx) throw new Error("Web Audio API is not supported in this browser.");
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch (e) {
      console.warn("Failed to resume AudioContext:", e);
    }
  }
  return ctx;
}

export async function loadSample(url) {
  const ctx = await ensureAudioContextUnlocked();
  if (!ctx) throw new Error("AudioContext not available");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sample: ${res.status}`);

  const arrayBuf = await res.arrayBuffer();
  if (!arrayBuf || arrayBuf.byteLength === 0) {
    throw new Error("Empty audio file.");
  }

  // Một số browser cũ không support promise decodeAudioData
  return new Promise((resolve, reject) => {
    try {
      const p = ctx.decodeAudioData(arrayBuf);
      if (p && typeof p.then === "function") {
        p.then((buffer) => resolve({ ctx, audioBuf: buffer })).catch(reject);
      } else {
        ctx.decodeAudioData(
          arrayBuf,
          (buffer) => resolve({ ctx, audioBuf: buffer }),
          (err) => reject(err || new Error("decodeAudioData failed"))
        );
      }
    } catch (err) {
      reject(err);
    }
  });
}
