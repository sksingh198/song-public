import { useEffect, useMemo, useState } from "react";
import PromptStudio from "./components/PromptStudio.jsx";
import SongPlayer from "./components/SongPlayer.jsx";
import SongSheet from "./components/SongSheet.jsx";
import { createSongPlayer } from "./audio/player.js";

export default function App() {
  const [story, setStory] = useState("");
  const [language, setLanguage] = useState("english");
  const [genre, setGenre] = useState("auto");
  const [mood, setMood] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [song, setSong] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [muteVocals, setMuteVocals] = useState(false);
  const [muteInstruments, setMuteInstruments] = useState(false);

  const player = useMemo(() => createSongPlayer(), []);

  useEffect(() => {
    return () => player.stop();
  }, [player]);

  async function generate() {
    setError("");
    setNotice("");
    setLoading(true);
    player.stop();
    setPlaying(false);
    setProgress(0);
    setActiveSectionId(null);
    try {
      const res = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story, language, genre, mood }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.details ? Object.values(data.details).join(" ") : "";
        throw new Error(data.error || detail || "Could not generate a song.");
      }
      setSong(data.song);
      if (data.notice) setNotice(data.notice);
    } catch (err) {
      setError(err.message || "Could not generate a song.");
    } finally {
      setLoading(false);
    }
  }

  function play() {
    if (!song) return;
    player.setVolume(volume);
    player.setVocalsMuted(muteVocals);
    player.setInstrumentsMuted(muteInstruments);
    player.play(song, {
      onTick: (tick) => {
        setPlaying(tick.playing);
        setProgress(tick.progress);
        setActiveSectionId(tick.sectionId);
      },
    });
  }

  function stop() {
    player.stop();
    setPlaying(false);
  }

  function changeVolume(next) {
    setVolume(next);
    player.setVolume(next);
  }

  return (
    <main className="studio">
      <header className="hero">
        <p className="kicker">StoryToSong</p>
        <h1>Turn a story into a song</h1>
        <p className="lede">
          Paste an event, a memory, or a scene. Get lyrics, chords, a tune, and a playable
          preview in Hindi, English, or Bhojpuri.
        </p>
      </header>

      <div className="grid">
        <div>
          <PromptStudio
            story={story}
            language={language}
            genre={genre}
            mood={mood}
            loading={loading}
            error={error}
            onStory={setStory}
            onLanguage={setLanguage}
            onGenre={setGenre}
            onMood={setMood}
            onSubmit={generate}
          />
          {notice ? (
            <div className="banner info" role="status" style={{ marginTop: 12 }}>
              {notice}
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {song ? (
            <>
              <SongPlayer
                playing={playing}
                progress={progress}
                volume={volume}
                muteVocals={muteVocals}
                muteInstruments={muteInstruments}
                onPlay={play}
                onStop={stop}
                onVolume={changeVolume}
                onMuteVocals={() => {
                  const next = !muteVocals;
                  setMuteVocals(next);
                  player.setVocalsMuted(next);
                }}
                onMuteInstruments={() => {
                  const next = !muteInstruments;
                  setMuteInstruments(next);
                  player.setInstrumentsMuted(next);
                }}
              />
              <SongSheet song={song} activeSectionId={activeSectionId} />
            </>
          ) : (
            <div className="card empty">
              <h2>Your song will land here</h2>
              <p className="hint">
                Write at least a short scene, pick a language, then generate. Playback starts
                only when you press play.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
