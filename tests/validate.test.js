import { describe, it, expect } from "vitest";
import { validateGenerateRequest } from "../server/validate.js";

describe("validateGenerateRequest", () => {
  it("rejects a story shorter than 20 characters", () => {
    const result = validateGenerateRequest({
      story: "too short",
      language: "english",
      genre: "auto",
      mood: "auto",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.story).toMatch(/20/);
  });

  it("rejects an unknown language", () => {
    const result = validateGenerateRequest({
      story: "A long enough story about a night train leaving the city behind.",
      language: "french",
      genre: "auto",
      mood: "auto",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.language).toBeTruthy();
  });

  it("accepts a valid hindi request", () => {
    const result = validateGenerateRequest({
      story: "A long enough story about a night train leaving the city behind.",
      language: "hindi",
      genre: "filmi",
      mood: "romantic",
    });
    expect(result.ok).toBe(true);
    expect(result.value.language).toBe("hindi");
    expect(result.value.genre).toBe("filmi");
  });
});
