import { describe, it, expect } from "vitest";
import { composeSong } from "../server/composer.js";

const story =
  "Ravi left the village at dawn. His mother stood by the neem tree and waved until the bus was only dust.";

describe("composeSong", () => {
  it("returns a verse and a chorus in the requested language", () => {
    const song = composeSong({
      story,
      language: "english",
      genre: "auto",
      mood: "auto",
    });
    const types = song.sections.map((s) => s.type);
    expect(types).toContain("verse");
    expect(types).toContain("chorus");
    expect(song.language).toBe("english");
    expect(song.title.length).toBeGreaterThan(1);
    expect(song.bpm).toBeGreaterThanOrEqual(60);
  });

  it("weaves story words into english lyrics", () => {
    const song = composeSong({
      story,
      language: "english",
      genre: "folk",
      mood: "nostalgic",
    });
    const lyrics = song.sections.flatMap((s) => s.lyrics.map((l) => l.text)).join(" ");
    expect(lyrics.toLowerCase()).toMatch(/village|mother|neem|dawn|bus|dust|ravi/);
  });

  it("writes hindi lyrics in Devanagari", () => {
    const song = composeSong({
      story,
      language: "hindi",
      genre: "filmi",
      mood: "sad",
    });
    const lyrics = song.sections.flatMap((s) => s.lyrics.map((l) => l.text)).join(" ");
    expect(lyrics).toMatch(/[\u0900-\u097F]/);
  });

  it("produces different lyrics and titles for different stories", () => {
    const a = composeSong({
      story:
        "The astronaut kissed the moon and never came back to earth after the midnight launch.",
      language: "english",
      genre: "pop",
      mood: "hopeful",
    });
    const b = composeSong({
      story:
        "A street chef burned the last recipe when the restaurant closed in heavy rain.",
      language: "english",
      genre: "pop",
      mood: "hopeful",
    });
    const lyricsA = a.sections.flatMap((s) => s.lyrics.map((l) => l.text)).join("\n");
    const lyricsB = b.sections.flatMap((s) => s.lyrics.map((l) => l.text)).join("\n");
    expect(lyricsA).not.toBe(lyricsB);
    expect(a.title).not.toBe(b.title);
    expect(lyricsA.toLowerCase()).toMatch(/astronaut|moon|launch|earth/);
    expect(lyricsB.toLowerCase()).toMatch(/chef|recipe|restaurant|rain/);
  });

  it("writes a different second verse than the first", () => {
    const song = composeSong({
      story:
        "Maya found a red violin in the attic. Later she played it on the rooftop while the city slept under snow.",
      language: "english",
      genre: "ballad",
      mood: "nostalgic",
    });
    const verse1 = song.sections.find((s) => s.id === "verse1");
    const verse2 = song.sections.find((s) => s.id === "verse2");
    const t1 = verse1.lyrics.map((l) => l.text).join("\n");
    const t2 = verse2.lyrics.map((l) => l.text).join("\n");
    expect(t1).not.toBe(t2);
  });

  it("changes hindi lyrics when the story changes", () => {
    const a = composeSong({
      story: "Ravi left the village at dawn while his mother waited by the neem tree.",
      language: "hindi",
      genre: "folk",
      mood: "sad",
    });
    const b = composeSong({
      story: "A cricket champion lifted the trophy in Mumbai after the final over.",
      language: "hindi",
      genre: "folk",
      mood: "sad",
    });
    const lyricsA = a.sections.flatMap((s) => s.lyrics.map((l) => l.text)).join("\n");
    const lyricsB = b.sections.flatMap((s) => s.lyrics.map((l) => l.text)).join("\n");
    expect(lyricsA).not.toBe(lyricsB);
  });

  it("retells the story in english verses, not just keywords in a template", () => {
    const song = composeSong({
      story,
      language: "english",
      genre: "folk",
      mood: "nostalgic",
    });
    const lyrics = song.sections
      .filter((s) => s.type === "verse")
      .flatMap((s) => s.lyrics.map((l) => l.text))
      .join(" ")
      .toLowerCase();
    expect(lyrics).toMatch(/ravi/);
    expect(lyrics).toMatch(/mother/);
    expect(lyrics).toMatch(/neem/);
    expect(lyrics).toMatch(/village/);
    expect(lyrics).toMatch(/dawn/);
    expect(lyrics).not.toMatch(/i still see the ravi in the left/i);
  });

  it("places two-line shayari between verses and choruses", () => {
    const song = composeSong({
      story,
      language: "english",
      genre: "folk",
      mood: "nostalgic",
    });
    const shayari = song.sections.filter((s) => s.type === "shayari");
    expect(shayari.length).toBeGreaterThanOrEqual(2);
    for (const section of shayari) {
      expect(section.lyrics).toHaveLength(2);
      expect(section.lyrics.every((line) => line.text.trim().length > 8)).toBe(true);
    }
    const types = song.sections.map((s) => s.type).join(",");
    expect(types).toMatch(/verse,shayari,chorus/);
  });

  it("writes shayari from the story images", () => {
    const song = composeSong({
      story,
      language: "english",
      genre: "folk",
      mood: "nostalgic",
    });
    const text = song.sections
      .filter((s) => s.type === "shayari")
      .flatMap((s) => s.lyrics.map((l) => l.text))
      .join(" ")
      .toLowerCase();
    expect(text).toMatch(/neem|mother|village|dawn|bus|dust|ravi/);
  });
});
