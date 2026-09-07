const LANGUAGES = new Set(["hindi", "english", "bhojpuri"]);
const GENRES = new Set([
  "auto",
  "pop",
  "rock",
  "filmi",
  "ghazal",
  "folk",
  "hiphop",
  "ballad",
  "devotional",
  "dance",
]);
const MOODS = new Set([
  "auto",
  "joyful",
  "sad",
  "romantic",
  "angry",
  "hopeful",
  "nostalgic",
  "energetic",
  "peaceful",
]);

export function validateGenerateRequest(body) {
  const errors = {};
  const story = typeof body?.story === "string" ? body.story.trim() : "";
  const language = typeof body?.language === "string" ? body.language.trim().toLowerCase() : "";
  const genre = typeof body?.genre === "string" ? body.genre.trim().toLowerCase() : "auto";
  const mood = typeof body?.mood === "string" ? body.mood.trim().toLowerCase() : "auto";

  if (story.length < 20) {
    errors.story = "Story must be at least 20 characters.";
  } else if (story.length > 8000) {
    errors.story = "Story must be 8000 characters or fewer.";
  }

  if (!LANGUAGES.has(language)) {
    errors.language = "Language must be hindi, english, or bhojpuri.";
  }

  if (!GENRES.has(genre)) {
    errors.genre = "Unknown genre.";
  }

  if (!MOODS.has(mood)) {
    errors.mood = "Unknown mood.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { story, language, genre, mood },
  };
}
