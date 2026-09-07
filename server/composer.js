import { normalizeSong } from "./normalize.js";

const STOP = new Set(
  "a an the and or but of to in on at for from with as is was were be been being this that these those it its he she they we you i my your our their his her him not no so if then when while after before over under out up down just only also very into about across again against all am among because between both by could did do does doing during each few further had has have having here how itself more most other own same than too until what where which who why will would till that there whose whom".split(
    " "
  )
);

function hashString(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickKeywords(story, count = 12) {
  const words = story
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP.has(w.toLowerCase()));
  const unique = [];
  for (const w of words) {
    const key = w.toLowerCase();
    if (!unique.some((u) => u.toLowerCase() === key)) unique.push(w);
    if (unique.length >= count) break;
  }
  return unique.length ? unique : ["heart", "night", "road", "home"];
}

function storyChunks(story, size = 8) {
  const words = story
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    const piece = words.slice(i, i + size).join(" ");
    if (piece.split(/\s+/).length >= 3) chunks.push(piece);
  }
  return chunks.length ? chunks : [story.trim()].filter(Boolean);
}

function sentencesOf(story) {
  const byStop = story
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.replace(/[.!?।]+$/g, "").trim())
    .filter((s) => s.split(/\s+/).length >= 3);
  if (byStop.length) return byStop;
  const byComma = story
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
  if (byComma.length) return byComma;
  return storyChunks(story, 8);
}

function splitIntoLines(sentence, maxWords = 7) {
  const words = sentence.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [sentence.trim()];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function wordAt(keywords, index, fallbacks) {
  if (keywords.length) return keywords[index % keywords.length];
  return fallbacks[index % fallbacks.length];
}

function titleCase(words) {
  return words
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferGenre(story, genre) {
  if (genre !== "auto") return genre;
  const t = story.toLowerCase();
  if (/god|temple|prayer|mandir|bhajan/.test(t)) return "devotional";
  if (/dance|club|beat|party/.test(t)) return "dance";
  if (/rap|street|hustle/.test(t)) return "hiphop";
  if (/film|bollywood|filmi/.test(t)) return "filmi";
  if (/ghazal|shayari/.test(t)) return "ghazal";
  if (/village|folk|field|neem/.test(t)) return "folk";
  if (/rock|guitar|riot/.test(t)) return "rock";
  if (/love|heart|kiss|shaadi/.test(t)) return "ballad";
  return "pop";
}

function inferMood(story, mood) {
  if (mood !== "auto") return mood;
  const t = story.toLowerCase();
  if (/sad|cry|tears|left|lost|death|mourn/.test(t)) return "sad";
  if (/love|romance|heart|kiss/.test(t)) return "romantic";
  if (/anger|angry|fight|rage/.test(t)) return "angry";
  if (/hope|rise|tomorrow|light/.test(t)) return "hopeful";
  if (/memory|remember|once|ago|nostalg/.test(t)) return "nostalgic";
  if (/joy|happy|laugh|celebrate/.test(t)) return "joyful";
  if (/peace|calm|quiet|still/.test(t)) return "peaceful";
  if (/run|race|fire|energy/.test(t)) return "energetic";
  return "hopeful";
}

const BPM = {
  pop: 108,
  rock: 126,
  filmi: 96,
  ghazal: 76,
  folk: 92,
  hiphop: 92,
  ballad: 78,
  devotional: 80,
  dance: 124,
};

const MOOD_BPM = {
  sad: -12,
  peaceful: -10,
  romantic: -6,
  nostalgic: -4,
  hopeful: 0,
  joyful: 8,
  energetic: 16,
  angry: 14,
};

const KEYS = ["C", "G", "D", "A", "F", "Am", "Em", "Dm"];

const PROGRESSIONS = {
  pop: ["C", "G", "Am", "F"],
  rock: ["E", "G", "A", "C"],
  filmi: ["C", "F", "G", "Em"],
  ghazal: ["Am", "Dm", "G", "C"],
  folk: ["G", "C", "D", "Em"],
  hiphop: ["Am", "F", "C", "G"],
  ballad: ["C", "Am", "F", "G"],
  devotional: ["G", "Em", "C", "D"],
  dance: ["Am", "G", "F", "E"],
};

function rotate(arr, n) {
  const i = n % arr.length;
  return arr.slice(i).concat(arr.slice(0, i));
}

function verseFromStory(sentences, keywords, verseIndex) {
  const half = Math.max(1, Math.ceil(sentences.length / 2));
  const slice = verseIndex === 0 ? sentences.slice(0, half) : sentences.slice(half);
  const pool = slice.length ? slice : sentences;
  const lines = [];
  for (const sentence of pool) {
    for (const part of splitIntoLines(sentence, 7)) {
      if (lines.length < 4) lines.push(part);
    }
  }
  const extra = [
    `${keywords[0] || "this story"} still lives in me`,
    `I keep ${keywords[1] || "the night"} close`,
    `${keywords[2] || "the road"} will not forget`,
    `this is how ${keywords[3] || "we"} remain`,
  ];
  let i = verseIndex;
  while (lines.length < 4) {
    lines.push(extra[i % extra.length]);
    i += 1;
  }
  return lines.slice(0, 4);
}

function englishChorus(keywords) {
  const a = keywords[0] || "home";
  const b = keywords[1] || "night";
  const c = keywords[2] || "heart";
  const d = keywords[3] || "road";
  return [
    `Come back through the ${b}`,
    `Don't let the ${a} fade`,
    `I am made of ${c} and ${d}`,
    `Sing this story till it stays`,
  ];
}

function englishBridge(sentences, keywords) {
  const last = sentences[sentences.length - 1] || `${keywords[0]} still calls`;
  return [
    splitIntoLines(last, 6)[0],
    `I will carry the ${keywords[2] || "heart"}`,
    `If the ${keywords[1] || "night"} is gone`,
    `let the ${keywords[3] || "song"} rise`,
  ];
}

function englishIntro(sentences, keywords) {
  const first = sentences[0] || `${keywords[0]} begins`;
  const parts = splitIntoLines(first, 6);
  return [parts[0], parts[1] || `hold the ${keywords[0] || "story"}`].slice(0, 2);
}

function englishShayari(keywords, index) {
  const a = wordAt(keywords, index, ["night"]);
  const b = wordAt(keywords, index + 1, ["heart"]);
  const c = wordAt(keywords, index + 2, ["road"]);
  const couplets = [
    [`The ${a} keeps a secret in the ${b}`, `and the ${c} writes it in dust.`],
    [`If the ${b} is a lantern, the ${a} is wind`, `yet I walk the ${c} anyway.`],
    [`Between the ${a} and the ${b}`, `a whole life learned how to wait.`],
  ];
  return couplets[index % couplets.length];
}

function hindiVerse(sentences, keywords, verseIndex) {
  const scene = sentences[verseIndex] || sentences[0] || keywords.slice(0, 6).join(" ");
  const later = sentences[verseIndex + 1] || sentences[sentences.length - 1] || scene;
  const a = wordAt(keywords, verseIndex * 3, ["याद"]);
  const b = wordAt(keywords, verseIndex * 3 + 1, ["राह"]);
  const c = wordAt(keywords, verseIndex * 3 + 2, ["दिल"]);
  return [
    `${a} की कहानी यूँ शुरू हुई`,
    scene,
    `${b} अब भी साँस लेती है`,
    later,
    `${c} नहीं भूला कोई`,
  ].slice(0, 4);
}

function hindiChorus(keywords) {
  const a = wordAt(keywords, 0, ["घर"]);
  const b = wordAt(keywords, 1, ["दिल"]);
  const c = wordAt(keywords, 2, ["याद"]);
  return [
    `ले चल मुझे वापस ${a}`,
    `${b} पुकारे मेरा नाम`,
    `दूर सफर है पर ${c} है पास`,
    `यह कहानी बने एक गाना`,
  ];
}

function hindiBridge(sentences, keywords) {
  const last = sentences[sentences.length - 1] || wordAt(keywords, 0, ["याद"]);
  return [`${wordAt(keywords, 0, ["याद"])} साथ चलेंगे`, last, "मैं अकेला नहीं हूँ", `${wordAt(keywords, 1, ["दिल"])} बचेगा रातों में`];
}

function hindiIntro(keywords) {
  return [`${wordAt(keywords, 0, ["याद"])} थामा है`, `${wordAt(keywords, 1, ["राह"])} उठे`];
}

function hindiShayari(keywords, index) {
  const a = wordAt(keywords, index, ["याद"]);
  const b = wordAt(keywords, index + 1, ["छाँव"]);
  const c = wordAt(keywords, index + 2, ["राह"]);
  const couplets = [
    [`जो ${a} गया वो रूमाल सा उड़ गया`, `${b} की छाँव अब भी खड़ी है`],
    [`${a} और ${b} के दरमियान`, `${c} ने एक खामोशी लिखी`],
    [`दीया जला के ${a} को पुकारा`, `${b} ने कहा मैं यहीं हूँ`],
  ];
  return couplets[index % couplets.length];
}

function bhojpuriVerse(sentences, keywords, verseIndex) {
  const scene = sentences[verseIndex] || sentences[0] || keywords.slice(0, 6).join(" ");
  const later = sentences[verseIndex + 1] || sentences[sentences.length - 1] || scene;
  const a = wordAt(keywords, verseIndex * 3, ["गाँव"]);
  const b = wordAt(keywords, verseIndex * 3 + 1, ["मन"]);
  return [
    `फजर में ${a} छोड़ के चलली`,
    scene,
    `${b} में घर बा अब भी`,
    later,
  ].slice(0, 4);
}

function bhojpuriChorus(keywords) {
  const a = wordAt(keywords, 0, ["घर"]);
  const b = wordAt(keywords, 1, ["मन"]);
  const c = wordAt(keywords, 2, ["कहानी"]);
  return [
    `${a} ले चल हमके सजन`,
    `दूर बा सफर ${b} पास बा`,
    `गाना में कहब ई ${c}`,
    `आवाज बा तनी जोर से`,
  ];
}

function bhojpuriBridge(sentences, keywords) {
  const last = sentences[sentences.length - 1] || wordAt(keywords, 0, ["घर"]);
  return [`${wordAt(keywords, 0, ["घर"])} के दीया जलत बा`, last, "हम अकेले नइखी", `${wordAt(keywords, 1, ["मन"])} से दूर नइखी`];
}

function bhojpuriIntro(keywords) {
  return [`${wordAt(keywords, 0, ["घर"])} थाम`, `${wordAt(keywords, 1, ["मन"])} उठे`];
}

function bhojpuriShayari(keywords, index) {
  const a = wordAt(keywords, index, ["गाँव"]);
  const b = wordAt(keywords, index + 1, ["मइया"]);
  const c = wordAt(keywords, index + 2, ["राह"]);
  const couplets = [
    [`${a} के धूर उड़ल, ${b} खड़ी रहीं`, `${c} में हमार साँस छूट गइल`],
    [`जो ${a} गइल ऊ रूमाल जइसन उड़ल`, `${b} के छाँव अबो बा`],
    [`${a} आ ${b} के बिचा में`, `${c} एक खामोशी लिखले बा`],
  ];
  return couplets[index % couplets.length];
}

function linesFor(language, role, ctx) {
  const { keywords, sentences, verseIndex, shayariIndex } = ctx;
  if (language === "hindi") {
    if (role === "verse") return hindiVerse(sentences, keywords, verseIndex);
    if (role === "chorus") return hindiChorus(keywords);
    if (role === "bridge") return hindiBridge(sentences, keywords);
    if (role === "shayari") return hindiShayari(keywords, shayariIndex);
    return hindiIntro(keywords);
  }
  if (language === "bhojpuri") {
    if (role === "verse") return bhojpuriVerse(sentences, keywords, verseIndex);
    if (role === "chorus") return bhojpuriChorus(keywords);
    if (role === "bridge") return bhojpuriBridge(sentences, keywords);
    if (role === "shayari") return bhojpuriShayari(keywords, shayariIndex);
    return bhojpuriIntro(keywords);
  }
  if (role === "verse") return verseFromStory(sentences, keywords, verseIndex);
  if (role === "chorus") return englishChorus(keywords);
  if (role === "bridge") return englishBridge(sentences, keywords);
  if (role === "shayari") return englishShayari(keywords, shayariIndex);
  return englishIntro(sentences, keywords);
}

function toLyricLines(texts, bars) {
  const beats = bars * 4;
  const slice = Math.max(1, Math.floor(beats / texts.length));
  return texts.map((text, i) => ({
    text,
    startBeat: i * slice,
    durationBeats: slice,
  }));
}

function melodyContour(seed, mood, genre) {
  const rnd = mulberry32(seed);
  const sad = mood === "sad" || genre === "ghazal";
  const base = sad ? [0, 1, 3, 5, 3, 1, 0, 3] : [0, 2, 4, 5, 7, 5, 4, 2];
  const extra = Array.from({ length: 8 }, () => Math.floor(rnd() * 8));
  return base.concat(extra).map((n, i) => {
    const wobble = Math.floor(rnd() * 3) - 1;
    return Math.max(-2, Math.min(12, n + wobble + (i % 3 === 0 ? seed % 2 : 0)));
  });
}

function makeTitle(language, keywords, seed) {
  if (language === "hindi") {
    const a = keywords[0] || "याद";
    const b = keywords[1] || "राह";
    const titles = [`${a} की राह`, `${b} का राग`, `${a} ${b}`, `वापसी: ${a}`];
    return titles[seed % titles.length];
  }
  if (language === "bhojpuri") {
    const a = keywords[0] || "घर";
    const b = keywords[1] || "राह";
    const titles = [`${a} के राह`, `${b} वाला गाना`, `${a} ${b}`];
    return titles[seed % titles.length];
  }
  return titleCase(keywords) || "Night Road";
}

function section(id, type, name, bars, lyrics, chords) {
  return { id, type, name, bars, lyrics: toLyricLines(lyrics, bars), chords };
}

export function composeSong({ story, language, genre, mood }) {
  const g = inferGenre(story, genre);
  const m = inferMood(story, mood);
  const keywords = pickKeywords(story);
  const sentences = sentencesOf(story);
  const seed = hashString(story + language + g + m);
  const bpm = Math.max(60, Math.min(180, (BPM[g] || 100) + (MOOD_BPM[m] || 0) + (seed % 5) - 2));
  const key = KEYS[seed % KEYS.length].replace(/m$/, "") || "C";
  const chords = rotate(PROGRESSIONS[g] || PROGRESSIONS.pop, seed % 3);
  const chorusChords = rotate(chords, 1);
  const shayariChords = [chords[0], chords[2] || chords[0]];

  const verseBars = 4;
  const chorusBars = 4;
  const ctx = { keywords, sentences, verseIndex: 0, shayariIndex: 0 };

  const sections = [
    section("intro", "intro", "Intro", 2, linesFor(language, "intro", ctx), chords.slice(0, 2)),
    section(
      "verse1",
      "verse",
      "Verse 1",
      verseBars,
      linesFor(language, "verse", { ...ctx, verseIndex: 0 }),
      chords
    ),
    section(
      "shayari1",
      "shayari",
      "Shayari",
      2,
      linesFor(language, "shayari", { ...ctx, shayariIndex: 0 }),
      shayariChords
    ),
    section("chorus1", "chorus", "Chorus", chorusBars, linesFor(language, "chorus", ctx), chorusChords),
    section(
      "verse2",
      "verse",
      "Verse 2",
      verseBars,
      linesFor(language, "verse", { ...ctx, verseIndex: 1 }),
      chords
    ),
    section(
      "shayari2",
      "shayari",
      "Shayari",
      2,
      linesFor(language, "shayari", { ...ctx, shayariIndex: 1 }),
      shayariChords
    ),
    section("chorus2", "chorus", "Chorus", chorusBars, linesFor(language, "chorus", ctx), chorusChords),
    section("bridge", "bridge", "Bridge", 4, linesFor(language, "bridge", ctx), [
      chords[2],
      chords[3],
      chords[0],
      chords[1],
    ]),
    section("chorus3", "chorus", "Final Chorus", chorusBars, linesFor(language, "chorus", ctx), chorusChords),
    section("outro", "outro", "Outro", 2, linesFor(language, "intro", ctx), chords.slice(0, 2)),
  ];

  return normalizeSong(
    {
      title: makeTitle(language, keywords, seed),
      language,
      genre: g,
      mood: m,
      bpm,
      key,
      vocalStyle:
        language === "english"
          ? "warm mid-range, close-mic, slight reverb"
          : "filmi mid-range, expressive, light reverb",
      rhymeNotes:
        language === "english"
          ? `Verses retell ${keywords.slice(0, 3).join(", ")}; two-line shayari sits between verse and chorus.`
          : `कहानी के बोल; शायरी दो पंक्तियों में verse और chorus के बीच।`,
      melody: {
        scale: m === "sad" || g === "ghazal" ? "minor" : "major",
        contour: melodyContour(seed, m, g),
      },
      sections,
    },
    language
  );
}
