import { describe, it, expect } from "vitest";
import { sectionBeats, songTimeline } from "../src/audio/beats.js";

describe("beats", () => {
  it("counts 4/4 bars as 4 beats each", () => {
    expect(sectionBeats({ bars: 4 })).toBe(16);
  });

  it("builds a timeline of section offsets", () => {
    const timeline = songTimeline([
      { id: "v1", bars: 4 },
      { id: "c1", bars: 8 },
    ]);
    expect(timeline.totalBeats).toBe(48);
    expect(timeline.sections[0]).toMatchObject({ id: "v1", startBeat: 0, beats: 16 });
    expect(timeline.sections[1]).toMatchObject({ id: "c1", startBeat: 16, beats: 32 });
  });
});
