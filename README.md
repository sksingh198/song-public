# StoryToSong

Turn a story, event, or prompt into lyrics, chords, a melody, and a playable preview.

Languages: Hindi, English, Bhojpuri.

## Localhost URL

After you start the app on your PC:

- Development: [http://localhost:5173](http://localhost:5173)
- Production-style (one server): [http://localhost:3001](http://localhost:3001)

## Run from GitHub on your PC (CMD)

```bash
git clone https://github.com/sksingh198/song-public.git
cd song-public
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

Windows Command Prompt (CMD):

```bat
git clone https://github.com/sksingh198/song-public.git
cd song-public
npm install
npm run dev
```

The terminal will print:

```
StoryToSong API  http://localhost:3001
Local:           http://localhost:5173/
```

Use **http://localhost:5173** while developing. Vite forwards `/api` to port 3001.

## One-command local server

Builds the site and serves app + API on one URL:

```bash
npm install
npm start
```

Open **http://localhost:3001**

## Optional AI lyrics

Copy `.env.example` to `.env` and set your own key:

```
USER_LLM_API_KEY=your-api-key-here
USER_LLM_BASE_URL=https://api.openai.com/v1
USER_LLM_MODEL=gpt-4o-mini
```

Without a key, the built-in songwriter still generates a full song.

## Tests

```bash
npm test
```

Vocals are synthesized (speech plus pitched tones), not a human singer.
