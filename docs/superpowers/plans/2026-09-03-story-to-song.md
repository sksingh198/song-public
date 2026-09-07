# StoryToSong Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React studio with a Node API that turns a story prompt into lyrics, chords, melody, and a playable in-browser song in Hindi, English, or Bhojpuri.

**Architecture:** Frontend posts `/api/generate-song`. Express validates, calls the user LLM when `USER_LLM_*` is set, otherwise uses a local composer so Generate always works. Browser Web Audio plays drums, bass, chords, lead, and synthesized vocals.

**Tech Stack:** React 19, Vite 6, Express, Vitest, Web Audio API, Web Speech API.

## Global Constraints

- LLM keys are only `USER_LLM_API_KEY`, `USER_LLM_BASE_URL`, `USER_LLM_MODEL` (never agent env names).
- Vite `server.allowedHosts` includes `.monkeycode-ai.live`.
- Vite proxies `/api` to `http://localhost:3001`.
- Languages: `hindi` | `english` | `bhojpuri`.
- No emoji in UI. SVG icons only.
- Vocals are synthesized; player states this once.
- No comments in source unless asked.

## File map

- `server/validate.js` — request validation
- `server/parseSong.js` — JSON extract + repair
- `server/normalize.js` — BPM/key/sections
- `server/composer.js` — local story-to-song
- `server/llm.js` — OpenAI-compatible chat
- `server/prompt.js` — LLM system prompt
- `server/index.js` — Express `/api/generate-song`
- `src/audio/chords.js` — chord to frequencies
- `src/audio/beats.js` — section/song timing
- `src/audio/player.js` — Web Audio arrangement + vocals
- `src/App.jsx` + components — studio UI
- `tests/*.test.js` — unit tests

### Task 1: Core song modules + API + studio UI

Implement tests then production code for validation, parse, normalize, chords, beats, composer, LLM, Express, Vite app, player, and UI. Run `npm test`. Start both servers for preview.

- [x] Plan written
- [ ] Tests then implementation
- [ ] Preview deploy
