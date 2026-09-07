const KNOWN_KEYS = new Set([
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
]);

const SECTION_TYPES = new Set(["intro", "verse", "prechorus", "chorus", "bridge", "outro", "shayari"]);

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function normalizeLine(line, index) {
  const text = typeof line?.text === "string" ? line.text.trim() : "";
  return {
    text: text || "...",
    startBeat: clamp(Number(line?.startBeat) || index * 4, 0, 64),
    durationBeats: clamp(Number(line?.durationBeats) || 4, 1, 32),
  };
}

function normalizeSection(section, index) {
  const type = SECTION_TYPES.has(section?.type) ? section.type : "verse";
  const bars = clamp(Math.round(Number(section?.bars) || 4), 2, 16);
  const lyrics = Array.isArray(section?.lyrics) && section.lyrics.length
    ? section.lyrics.map(normalizeLine)
    : [{ text: "...", startBeat: 0, durationBeats: bars * 4 }];
  const chords = Array.isArray(section?.chords) && section.chords.length
    ? section.chords.map((c) => String(c || "C"))
    : ["C", "G", "Am", "F"];
  while (chords.length < bars) chords.push(chords[chords.length - 1] || "C");
  return {
    id: section?.id ? String(section.id) : `s${index + 1}`,
    type,
    name: section?.name ? String(section.name) : type,
    bars,
    lyrics,
    chords: chords.slice(0, bars),
  };
}

export function normalizeSong(raw, fallbackLanguage = "english") {
  if (!raw || typeof raw !== "object") {
    throw new Error("Song payload was empty.");
  }

  const sections = Array.isArray(raw.sections)
    ? raw.sections.map(normalizeSection)
    : [];

  const types = new Set(sections.map((s) => s.type));
  if (!types.has("verse") || !types.has("chorus")) {
    throw new Error("Song must include a verse and a chorus.");
  }

  const keyRaw = String(raw.key || "C").replace(/minor|min|m$/i, "").trim();
  const keyMatch = keyRaw.match(/^([A-Ga-g])([#b]?)/);
  const key = keyMatch ? keyMatch[1].toUpperCase() + (keyMatch[2] || "") : "C";

  const contour = Array.isArray(raw.melody?.contour)
    ? raw.melody.contour.map((n) => clamp(Number(n) || 0, -7, 14))
    : [0, 2, 4, 5, 4, 2, 0, 4];

  return {
    title: String(raw.title || "Untitled Song").slice(0, 80),
    language: ["hindi", "english", "bhojpuri"].includes(raw.language)
      ? raw.language
      : fallbackLanguage,
    genre: String(raw.genre || "pop"),
    mood: String(raw.mood || "hopeful"),
    bpm: clamp(Math.round(Number(raw.bpm) || 100), 60, 180),
    key: KNOWN_KEYS.has(key) ? key : "C",
    timeSignature: "4/4",
    vocalStyle: String(raw.vocalStyle || "warm mid-range vocal"),
    rhymeNotes: String(raw.rhymeNotes || ""),
    melody: {
      scale: String(raw.melody?.scale || "major"),
      contour,
    },
    sections,
  };
}
