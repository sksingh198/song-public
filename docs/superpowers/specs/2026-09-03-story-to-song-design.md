# StoryToSong Design

Date: 2026-09-03
Status: Approved for implementation planning

## Problem

A user has a story, event, or free-text prompt and wants a real song from it: lyrics, language, tune, phrases, vocals, and a playable preview. There is no existing app in this repo.

## Goal

Build a web studio that turns a text prompt into a full song package and plays it in the browser.

Success looks like:

- User pastes a story and gets a titled song with structure, lyrics, rhyme notes, chords, melody contour, and vocal direction.
- Language is Hindi, English, or Bhojpuri (user pick, defaulting to an explicit choice).
- Genre and mood are inferred from the story, with optional overrides.
- User can play a preview: drums, bass, chords, lead melody, and synthesized vocals.
- Everything is driven by the text prompt plus optional style overrides. No MIDI upload, no DAW, no paid music API.

Out of scope:

- Human-quality singing (vocals are synthesized: Web Speech + pitched tones).
- Stem export, MIDI export, or commercial mastering.
- User accounts, song history persistence beyond the current session.
- Training or hosting a local LLM.

## Architecture

Vite + React frontend and a small Node (Express) backend.

```
Browser (Vite :5173)
  PromptStudio -> POST /api/generate-song
  SongSheet    <- SongPackage JSON
  SongPlayer   -> arrangementEngine + vocalEngine (Web Audio / Speech)
        |
        | proxy /api -> localhost:3001
        v
Node API
  validate -> LLM prompt -> parse/repair JSON -> SongPackage
```

Vite `server.proxy` forwards `/api` to the backend so the preview environment exposes one port. `server.allowedHosts` includes `.monkeycode-ai.live`.

The LLM is the user's own key, never the agent environment:

- `USER_LLM_API_KEY`
- `USER_LLM_BASE_URL` (OpenAI-compatible, default `https://api.openai.com/v1`)
- `USER_LLM_MODEL` (default `gpt-4o-mini`)

## Components

### PromptStudio

- Story textarea (required, min 20 characters, max 8000).
- Language chips: Hindi, English, Bhojpuri. One must be selected. Default English.
- Optional genre select: Auto, Pop, Rock, Filmi, Ghazal, Folk, Hip-Hop, Ballad, Devotional, Dance.
- Optional mood select: Auto, Joyful, Sad, Romantic, Angry, Hopeful, Nostalgic, Energetic, Peaceful.
- Generate button, loading, and error banner.

### SongSheet

Renders the `SongPackage`: title, language, inferred genre/mood/BPM/key, lyrics grouped by section, chords per section, rhyme notes, vocal style. Copy-all button copies a readable text pack.

### SongPlayer

Play / pause, progress bar, current section highlight, volume, mute vocals, mute instruments. Starts only on user click (autoplay policy).

### `POST /api/generate-song`

Request:

```json
{
  "story": "string",
  "language": "hindi" | "english" | "bhojpuri",
  "genre": "auto" | "pop" | "rock" | "filmi" | "ghazal" | "folk" | "hiphop" | "ballad" | "devotional" | "dance",
  "mood": "auto" | "joyful" | "sad" | "romantic" | "angry" | "hopeful" | "nostalgic" | "energetic" | "peaceful"
}
```

Response: `SongPackage` (see Data model).

The handler validates input, builds a strict JSON-schema system prompt, calls the OpenAI-compatible chat completions endpoint, parses JSON, and if parse fails, runs one repair pass (ask the model to return valid JSON only). Then it normalizes fields (BPM clamp 60-180, known keys, required sections).

### arrangementEngine (browser)

Maps `SongPackage` to Web Audio:

- Transport from `bpm` and section bar counts.
- Kick / snare / closed hat pattern from genre.
- Bass from chord roots.
- Pad / guitar-like chords from `chords`.
- Lead from `melody` scale degrees relative to `key`.

No sample packs. Oscillators + noise + envelopes only so it works offline after generation.

### vocalEngine (browser)

For each lyric line with `startBeat`:

- Speak the line with `speechSynthesis` using `hi-IN` for Hindi and Bhojpuri, `en-US` for English. If the preferred voice is missing, fall back to the first available voice.
- Simultaneously play a soft pitched "vocal" tone following the melody so the preview feels like a song, not spoken word over a click.

Vocals are not a human singer. The UI states this once on the player.

## Data model

```ts
type Language = "hindi" | "english" | "bhojpuri"
type SectionType = "intro" | "verse" | "prechorus" | "chorus" | "bridge" | "outro"

interface LyricLine {
  text: string
  startBeat: number
  durationBeats: number
}

LyricLine.startBeat is relative to the start of that section (0 = first beat of the section). durationBeats is how long the line occupies. chords[i] is the chord for bar i of the section (4/4). melody.contour is scale degrees (0 = tonic) looped across lead notes, one value per beat.

interface SongSection {
  id: string
  type: SectionType
  name: string
  bars: number
  lyrics: LyricLine[]
  chords: string[]
}

interface SongPackage {
  title: string
  language: Language
  genre: string
  mood: string
  bpm: number
  key: string
  timeSignature: "4/4"
  vocalStyle: string
  rhymeNotes: string
  melody: {
    scale: string
    contour: number[]
  }
  sections: SongSection[]
}
```

Typical structure: intro, verse, chorus, verse, chorus, bridge, chorus, outro. The model may omit intro/bridge if the story is very short, but must include at least one verse and one chorus.

## Data flow

1. User pastes story, picks language, optionally overrides genre/mood, clicks Generate.
2. Frontend POSTs `/api/generate-song`.
3. Backend calls LLM with a system prompt that demands a single JSON object matching `SongPackage`.
4. Frontend stores the package in React state and renders SongSheet.
5. Play starts `AudioContext`, schedules arrangement + vocals, highlights the active section.
6. Stop / pause tears down or suspends the context. Regenerating replaces state and stops playback.

The player never calls the LLM.

## Error handling

| Case | Behavior |
| --- | --- |
| Story too short / empty | Client validation, no request |
| Missing `USER_LLM_API_KEY` | 503 with message to set key in `.env` from `.env.example` |
| LLM HTTP error | 502 with truncated provider message |
| Invalid JSON | One repair retry, then 502 "could not parse song" |
| Autoplay | Play only on click |
| Missing speech voice | Fallback voice; instruments still play |
| Unknown chord / key | Fall back to C major triad / C |

## Testing

- Request validation: language enum, story length.
- JSON parse and one-shot repair.
- BPM / key normalization.
- Chord name to note frequencies.
- Section beat math (bars * 4 in 4/4).
- Manual: generate and play one song in each language.

## UI notes

Studio aesthetic: dark stage, gold/cream type, one-column layout on mobile, split sheet + player on desktop. Language chips and Generate are always visible. No emoji in the UI.

## Configuration

`.env.example`:

```
USER_LLM_API_KEY=your-api-key-here
USER_LLM_BASE_URL=https://api.openai.com/v1
USER_LLM_MODEL=gpt-4o-mini
```

Backend reads only `USER_LLM_*`. It must not read agent environment key names.

## Startup

`package.json` scripts start backend on 3001 and Vite on 5173. Vite proxies `/api`. Deploy-website preview uses the Vite port.
