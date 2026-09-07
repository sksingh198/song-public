function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export default function SongPlayer({
  playing,
  progress,
  volume,
  muteVocals,
  muteInstruments,
  onPlay,
  onStop,
  onVolume,
  onMuteVocals,
  onMuteInstruments,
}) {
  return (
    <div className="card player">
      <h2>Preview</h2>
      <p className="hint">
        Vocals are synthesized (speech plus pitched tones), not a human singer.
      </p>
      <div className="player-row">
        {playing ? (
          <button type="button" className="icon-btn" onClick={onStop} aria-label="Stop">
            <StopIcon />
          </button>
        ) : (
          <button type="button" className="icon-btn" onClick={onPlay} aria-label="Play">
            <PlayIcon />
          </button>
        )}
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <label className="volume">
          Volume
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => onVolume(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="player-row">
        <button
          type="button"
          className="toggle"
          aria-pressed={muteVocals}
          onClick={onMuteVocals}
        >
          {muteVocals ? "Vocals off" : "Vocals on"}
        </button>
        <button
          type="button"
          className="toggle"
          aria-pressed={muteInstruments}
          onClick={onMuteInstruments}
        >
          {muteInstruments ? "Instruments off" : "Instruments on"}
        </button>
      </div>
    </div>
  );
}
