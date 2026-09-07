import { describe, it, expect } from "vitest";
import { chordToFrequencies, noteFrequency } from "../src/audio/chords.js";

describe("chords", () => {
  it("maps A4 to 440Hz", () => {
    expect(noteFrequency("A", 4)).toBeCloseTo(440, 5);
  });

  it("returns a C major triad", () => {
    const freqs = chordToFrequencies("C");
    expect(freqs).toHaveLength(3);
    expect(freqs[0]).toBeCloseTo(noteFrequency("C", 4), 5);
    expect(freqs[1]).toBeCloseTo(noteFrequency("E", 4), 5);
    expect(freqs[2]).toBeCloseTo(noteFrequency("G", 4), 5);
  });

  it("falls back to C major for unknown chords", () => {
    const freqs = chordToFrequencies("not-a-chord");
    expect(freqs[0]).toBeCloseTo(noteFrequency("C", 4), 5);
  });
});
