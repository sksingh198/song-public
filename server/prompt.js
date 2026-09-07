export function buildSongPrompt({ story, language, genre, mood }) {
  return {
    system: `You are a professional songwriter and arranger. Return ONLY a single JSON object. No markdown, no commentary.

The JSON must match:
{
  "title": string,
  "language": "hindi" | "english" | "bhojpuri",
  "genre": string,
  "mood": string,
  "bpm": number,
  "key": string,
  "vocalStyle": string,
  "rhymeNotes": string,
  "melody": { "scale": string, "contour": number[] },
  "sections": [
    {
      "id": string,
      "type": "intro" | "verse" | "prechorus" | "chorus" | "bridge" | "outro" | "shayari",
      "name": string,
      "bars": number,
      "lyrics": [{ "text": string, "startBeat": number, "durationBeats": number }],
      "chords": string[]
    }
  ]
}

Rules:
- Lyrics MUST be in the requested language. Hindi and Bhojpuri use Devanagari.
- Verses MUST retell the user's story: names, places, objects, and plot. Do not use generic templates that only drop in one keyword.
- After every verse, insert a section type "shayari" with EXACTLY 2 short couplet lines (emotional, metaphorical), then the chorus.
- Prefer: intro, verse, shayari, chorus, verse, shayari, chorus, bridge, chorus, outro.
- Shayari is exactly 2 lyric lines and 2 bars.
- Include at least one verse and one chorus.
- chords[i] is the chord for bar i. 4/4 time.
- LyricLine.startBeat is relative to the section start.
- melody.contour is scale degrees, 0 = tonic, one idea per beat, 8-16 numbers.
- bpm 60-180. Common keys like C, G, D, Am, Em, F.
- Make the chorus hooky. Verses tell the story.`,
    user: `Language: ${language}
Genre: ${genre}
Mood: ${mood}
Story:
${story}`,
  };
}

export function buildRepairPrompt(broken) {
  return {
    system: "Return ONLY valid JSON for the song object. No markdown.",
    user: `Fix this into valid SongPackage JSON:\n${broken}`,
  };
}
