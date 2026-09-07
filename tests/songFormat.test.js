import { describe, it, expect } from "vitest";
import { songToText } from "../src/songFormat.js";

describe("songToText", () => {
  it("includes title, chords, and lyrics", () => {
    const text = songToText({
      title: "Night Road",
      language: "english",
      genre: "folk",
      mood: "sad",
      bpm: 92,
      key: "G",
      vocalStyle: "warm",
      rhymeNotes: "AABB",
      sections: [
        {
          id: "v1",
          name: "Verse 1",
          chords: ["G", "C"],
          lyrics: [{ text: "at dawn" }],
        },
      ],
    });
    expect(text).toMatch(/Night Road/);
    expect(text).toMatch(/G {2}\| {2}C/);
    expect(text).toMatch(/at dawn/);
  });
});
