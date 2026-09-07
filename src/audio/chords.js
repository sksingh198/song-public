const NOTE_INDEX = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const QUALITY_INTERVALS = {
  "": [0, 4, 7],
  maj: [0, 4, 7],
  M: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  "6": [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  "9": [0, 4, 7, 10, 14],
  add9: [0, 4, 7, 14],
};

export function noteFrequency(note, octave = 4) {
  const index = NOTE_INDEX[note];
  if (index === undefined) return noteFrequency("C", octave);
  const midi = (octave + 1) * 12 + index;
  return 440 * 2 ** ((midi - 69) / 12);
}

function parseChordName(name) {
  const raw = String(name || "").trim();
  const match = raw.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!match) return { root: "C", quality: "" };
  const root = match[1].toUpperCase() + (match[2] || "");
  let quality = match[3].replace(/[^a-zA-Z0-9]/g, "");
  if (quality === "mi" || quality === "min") quality = "m";
  if (quality === "major") quality = "";
  if (quality.startsWith("minor")) quality = "m" + quality.slice(5);
  return { root, quality };
}

export function chordToFrequencies(name, octave = 4) {
  const { root, quality } = parseChordName(name);
  const rootIndex = NOTE_INDEX[root];
  if (rootIndex === undefined) return chordToFrequencies("C", octave);
  const intervals = QUALITY_INTERVALS[quality] || QUALITY_INTERVALS[""];
  return intervals.slice(0, 3).map((interval) => {
    const midi = (octave + 1) * 12 + rootIndex + interval;
    return 440 * 2 ** ((midi - 69) / 12);
  });
}

export function rootNoteName(name) {
  const { root } = parseChordName(name);
  return NOTE_INDEX[root] === undefined ? "C" : root;
}

export function scaleDegrees(key, contour, octave = 5) {
  const rootIndex = NOTE_INDEX[key] ?? 0;
  const major = [0, 2, 4, 5, 7, 9, 11];
  return contour.map((degree) => {
    const safe = Number.isFinite(degree) ? Math.round(degree) : 0;
    const octaveShift = Math.floor(safe / 7);
    const step = ((safe % 7) + 7) % 7;
    const midi = (octave + 1) * 12 + rootIndex + major[step] + octaveShift * 12;
    return 440 * 2 ** ((midi - 69) / 12);
  });
}

export function noteNameFromIndex(index) {
  return NOTE_NAMES[((index % 12) + 12) % 12];
}
