import { chordToFrequencies, noteFrequency, rootNoteName, scaleDegrees } from "./chords.js";
import { songTimeline, beatToSeconds, sectionAtBeat } from "./beats.js";

function envGain(ctx, start, attack, sustain, release, peak) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(peak, start + attack);
  g.gain.setValueAtTime(peak, start + sustain);
  g.gain.exponentialRampToValueAtTime(0.0001, start + sustain + release);
  return g;
}

function playOsc(ctx, dest, type, freq, start, dur, peak, detune = 0) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  const g = envGain(ctx, start, 0.01, Math.max(0.02, dur - 0.08), 0.08, peak);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function playNoise(ctx, dest, start, dur, peak, hp = 800) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = envGain(ctx, start, 0.005, dur * 0.3, dur * 0.7, peak);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(start);
  src.stop(start + dur);
}

function drumPattern(genre) {
  const g = (genre || "").toLowerCase();
  if (g === "ballad" || g === "ghazal" || g === "devotional") {
    return { kick: [0, 2], snare: [2], hat: [0, 1, 2, 3], hatGain: 0.03 };
  }
  if (g === "rock" || g === "dance") {
    return { kick: [0, 1.5, 2.5], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], hatGain: 0.04 };
  }
  if (g === "hiphop") {
    return { kick: [0, 2.5], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], hatGain: 0.035 };
  }
  return { kick: [0, 2], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], hatGain: 0.035 };
}

function speakLine(text, lang, rate) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "english" ? "en-US" : "hi-IN";
  u.rate = rate;
  u.pitch = lang === "english" ? 1 : 1.05;
  u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const wanted = lang === "english" ? "en" : "hi";
  const match = voices.find((v) => v.lang.toLowerCase().startsWith(wanted));
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
}

export function createSongPlayer() {
  let ctx = null;
  let master = null;
  let instGain = null;
  let vocalGain = null;
  let timer = null;
  let startedAt = 0;
  let pausedAt = 0;
  let playing = false;
  let onTick = null;
  let songRef = null;
  let timeline = null;

  function ensureCtx() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
      instGain = ctx.createGain();
      vocalGain = ctx.createGain();
      instGain.connect(master);
      vocalGain.connect(master);
    }
    return ctx;
  }

  function schedule(song, when) {
    const t = songTimeline(song.sections);
    timeline = t;
    const bpm = song.bpm;
    const pattern = drumPattern(song.genre);
    const contour = song.melody?.contour?.length ? song.melody.contour : [0, 2, 4, 5, 4, 2];
    const leadFreqs = scaleDegrees(song.key, contour, 5);

    song.sections.forEach((section, sIndex) => {
      const sectionStart = t.sections[sIndex].startBeat;
      const bars = section.bars;
      for (let bar = 0; bar < bars; bar++) {
        const chord = section.chords[bar] || section.chords[section.chords.length - 1] || "C";
        const freqs = chordToFrequencies(chord, 4);
        const root = noteFrequency(rootNoteName(chord), 2);
        const barBeat = sectionStart + bar * 4;
        const barTime = when + beatToSeconds(barBeat, bpm);
        const beatDur = 60 / bpm;

        freqs.forEach((f, i) => {
          playOsc(ctx, instGain, "triangle", f, barTime, beatDur * 3.6, 0.045 / (i + 1), i * 4);
        });
        playOsc(ctx, instGain, "sawtooth", root, barTime, beatDur * 3.5, 0.07);

        for (let b = 0; b < 4; b++) {
          const beatTime = barTime + b * beatDur;
          if (pattern.kick.includes(b)) {
            playOsc(ctx, instGain, "sine", 90, beatTime, 0.18, 0.22);
            playOsc(ctx, instGain, "sine", 55, beatTime, 0.22, 0.12);
          }
          if (pattern.snare.includes(b)) {
            playNoise(ctx, instGain, beatTime, 0.12, 0.12, 1200);
            playOsc(ctx, instGain, "triangle", 180, beatTime, 0.08, 0.04);
          }
          pattern.hat.forEach((h) => {
            if (Math.floor(h) === b && h % 1 === 0) {
              playNoise(ctx, instGain, barTime + h * beatDur, 0.04, pattern.hatGain, 6000);
            } else if (h === b + 0.5) {
              playNoise(ctx, instGain, barTime + h * beatDur, 0.03, pattern.hatGain * 0.7, 7000);
            }
          });

          const lead = leadFreqs[(barBeat + b) % leadFreqs.length];
          playOsc(ctx, vocalGain, "sine", lead, beatTime, beatDur * 0.85, 0.06);
        }
      }

      section.lyrics.forEach((line) => {
        const startBeat = sectionStart + (line.startBeat || 0);
        const delayMs = beatToSeconds(startBeat, bpm) * 1000;
        const handle = setTimeout(() => {
          if (!playing) return;
          speakLine(line.text, song.language, song.bpm > 110 ? 1.05 : 0.95);
        }, delayMs);
        if (!schedule._speech) schedule._speech = [];
        schedule._speech.push(handle);
      });
    });

    return t;
  }

  function clearSpeech() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    (schedule._speech || []).forEach((id) => clearTimeout(id));
    schedule._speech = [];
  }

  function tick() {
    if (!playing || !ctx || !timeline || !songRef) return;
    const elapsed = ctx.currentTime - startedAt;
    const beat = (elapsed * songRef.bpm) / 60;
    const total = timeline.totalBeats;
    const section = sectionAtBeat(timeline, beat);
    if (onTick) {
      onTick({
        beat,
        totalBeats: total,
        progress: total ? Math.min(1, beat / total) : 0,
        sectionId: section?.id || null,
        playing: true,
      });
    }
    if (beat >= total) {
      stop();
    }
  }

  function play(song, handlers = {}) {
    stop();
    songRef = song;
    onTick = handlers.onTick || null;
    ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    playing = true;
    startedAt = ctx.currentTime + 0.08;
    pausedAt = 0;
    schedule(song, startedAt);
    timer = setInterval(tick, 80);
    tick();
  }

  function stop() {
    playing = false;
    clearSpeech();
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (ctx) {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
      ctx = null;
      master = null;
      instGain = null;
      vocalGain = null;
    }
    if (onTick) onTick({ beat: 0, totalBeats: timeline?.totalBeats || 0, progress: 0, sectionId: null, playing: false });
  }

  function setVolume(v) {
    ensureCtx();
    master.gain.value = Math.max(0, Math.min(1, v));
  }

  function setInstrumentsMuted(muted) {
    ensureCtx();
    instGain.gain.value = muted ? 0 : 1;
  }

  function setVocalsMuted(muted) {
    ensureCtx();
    vocalGain.gain.value = muted ? 0 : 1;
    if (muted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  return {
    play,
    stop,
    setVolume,
    setInstrumentsMuted,
    setVocalsMuted,
    get playing() {
      return playing;
    },
  };
}
