import { describe, it, expect } from "vitest";
import { parseSongJson } from "../server/parseSong.js";

describe("parseSongJson", () => {
  it("parses a raw JSON object", () => {
    const song = parseSongJson('{"title":"Moon","bpm":90}');
    expect(song.title).toBe("Moon");
    expect(song.bpm).toBe(90);
  });

  it("extracts JSON from a markdown fence", () => {
    const song = parseSongJson('Sure.\n```json\n{"title":"River"}\n```\n');
    expect(song.title).toBe("River");
  });

  it("returns null for unusable text", () => {
    expect(parseSongJson("not json at all")).toBeNull();
  });
});
