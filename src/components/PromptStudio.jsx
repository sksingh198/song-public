const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "bhojpuri", label: "Bhojpuri" },
];

const GENRES = [
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
];

const MOODS = [
  "auto",
  "joyful",
  "sad",
  "romantic",
  "angry",
  "hopeful",
  "nostalgic",
  "energetic",
  "peaceful",
];

export default function PromptStudio({
  story,
  language,
  genre,
  mood,
  loading,
  error,
  onStory,
  onLanguage,
  onGenre,
  onMood,
  onSubmit,
}) {
  const storyError = story.trim().length > 0 && story.trim().length < 20;

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2>Your story</h2>
      <label htmlFor="story">Story, event, or prompt</label>
      <textarea
        id="story"
        className="story"
        value={story}
        onChange={(event) => onStory(event.target.value)}
        placeholder="A mother waits by the neem tree as the dawn bus leaves the village..."
        maxLength={8000}
        required
      />
      {storyError ? (
        <p className="field-error" role="alert">
          Write at least 20 characters so the songwriter has something to hold.
        </p>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <label id="lang-label">Language</label>
        <div className="chips" role="group" aria-labelledby="lang-label">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              aria-pressed={language === item.id}
              onClick={() => onLanguage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div>
          <label htmlFor="genre">Genre</label>
          <select
            id="genre"
            className="select"
            value={genre}
            onChange={(event) => onGenre(event.target.value)}
          >
            {GENRES.map((item) => (
              <option key={item} value={item}>
                {item === "auto" ? "Auto from story" : item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mood">Mood</label>
          <select
            id="mood"
            className="select"
            value={mood}
            onChange={(event) => onMood(event.target.value)}
          >
            {MOODS.map((item) => (
              <option key={item} value={item}>
                {item === "auto" ? "Auto from story" : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button className="primary" type="submit" disabled={loading || story.trim().length < 20}>
        {loading ? <span className="spinner" aria-hidden="true" /> : null}
        {loading ? "Writing your song..." : "Generate song"}
      </button>

      {error ? (
        <div className="banner" role="alert">
          {error}
        </div>
      ) : null}
    </form>
  );
}
