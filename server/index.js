import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateGenerateRequest } from "./validate.js";
import { parseSongJson } from "./parseSong.js";
import { normalizeSong } from "./normalize.js";
import { composeSong } from "./composer.js";
import { buildSongPrompt, buildRepairPrompt } from "./prompt.js";
import { chatJson } from "./llm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  let text;
  try {
    text = fs.readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT) || 3001;

function llmConfig() {
  const apiKey = process.env.USER_LLM_API_KEY || "";
  const baseUrl = process.env.USER_LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.USER_LLM_MODEL || "gpt-4o-mini";
  return { apiKey, baseUrl, model };
}

async function generateFromLlm(input) {
  const { apiKey, baseUrl, model } = llmConfig();
  const prompt = buildSongPrompt(input);
  let raw = await chatJson({ apiKey, baseUrl, model, ...prompt });
  let parsed = parseSongJson(raw);
  if (!parsed) {
    const repair = buildRepairPrompt(raw);
    raw = await chatJson({ apiKey, baseUrl, model, ...repair });
    parsed = parseSongJson(raw);
  }
  if (!parsed) {
    const err = new Error("could not parse song");
    err.status = 502;
    throw err;
  }
  return normalizeSong(parsed, input.language);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, llm: Boolean(llmConfig().apiKey) });
});

app.post("/api/generate-song", async (req, res) => {
  const checked = validateGenerateRequest(req.body || {});
  if (!checked.ok) {
    return res.status(400).json({ error: "Invalid request", details: checked.errors });
  }

  const { apiKey } = llmConfig();
  try {
    if (apiKey) {
      const song = await generateFromLlm(checked.value);
      return res.json({ song, source: "llm" });
    }
    const song = composeSong(checked.value);
    return res.json({
      song,
      source: "local",
      notice: "No USER_LLM_API_KEY set. Using the built-in songwriter. Add your key in .env for AI lyrics.",
    });
  } catch (err) {
    const status = err.status === 401 || err.status === 403 ? 502 : err.status || 502;
    if (apiKey) {
      try {
        const song = composeSong(checked.value);
        return res.json({
          song,
          source: "local",
          notice: "AI songwriter failed. Playing a locally composed song instead.",
        });
      } catch {
        /* fall through */
      }
    }
    return res.status(status).json({
      error: err.message || "Song generation failed",
    });
  }
});

app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`StoryToSong API  http://localhost:${PORT}`);
});
