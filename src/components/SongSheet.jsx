import { songToText } from "../songFormat.js";

export default function SongSheet({ song, activeSectionId }) {
  async function copyAll() {
    const pack = songToText(song);
    try {
      await navigator.clipboard.writeText(pack);
    } catch {
      const box = document.createElement("textarea");
      box.value = pack;
      document.body.appendChild(box);
      box.select();
      document.execCommand("copy");
      document.body.removeChild(box);
    }
  }

  return (
    <article className="card">
      <div className="sheet-head">
        <div>
          <p className="kicker">Song sheet</p>
          <h2 style={{ marginBottom: 0 }}>{song.title}</h2>
        </div>
        <button type="button" className="ghost" onClick={copyAll}>
          Copy all
        </button>
      </div>
      <div className="meta">
        <span className="tag">{song.language}</span>
        <span className="tag">{song.genre}</span>
        <span className="tag">{song.mood}</span>
        <span className="tag">{song.bpm} BPM</span>
        <span className="tag">Key {song.key}</span>
      </div>
      <p className="hint">{song.vocalStyle}</p>
      {song.rhymeNotes ? <p className="hint">{song.rhymeNotes}</p> : null}

      {song.sections.map((section) => (
        <section
          key={section.id}
          className={[
            "section",
            section.id === activeSectionId ? "active" : "",
            section.type === "shayari" ? "shayari" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <h3>{section.name}</h3>
          <p className="chords">{section.chords.join("  |  ")}</p>
          {section.lyrics.map((line, index) => (
            <p className="lyric" key={`${section.id}-${index}`}>
              {line.text}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
