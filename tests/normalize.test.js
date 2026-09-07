import { describe, it, expect } from "vitest";
import { normalizeSong } from "../server/normalize.js";

const base = {
  title: "Night Train",
  language: "english",
  genre: "pop",
  mood: "nostalgic",
  bpm: 240,
  key: "H#",
  vocalStyle: "soft tenor",
  rhymeNotes: "AABB chorus",
  melody: { scale: "major", contour: [0, 2, 4, 5] },
  sections: [
    {
      id: "v1",
      type: "verse",
      name: "Verse 1",
      bars: 4,
      lyrics: [{ text: "wheels on steel", startBeat: 0, durationBeats: 8 }],
      chords: ["C", "Am", "F", "G"],
    },
    {
      id: "c1",
      type: "chorus",
      name: "Chorus",
      bars: 4,
      lyrics: [{ text: "take me home", startBeat: 0, durationBeats: 8 }],
      chords: ["F", "C", "G", "Am"],
    },
  ],
};

describe("normalizeSong", () => {
  it("clamps bpm between 60 and 180", () => {
    const song = normalizeSong(base, "english");
    expect(song.bpm).toBe(180);
  });

  it("falls back to C when the key is unknown", () => {
    const song = normalizeSong(base, "english");
    expect(song.key).toBe("C");
  });

  it("requires a verse and a chorus", () => {
    expect(() =>
      normalizeSong({ ...base, sections: [base.sections[0]] }, "english")
    ).toThrow(/chorus/i);
  });
});
