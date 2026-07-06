# World Cup Player Guess

A full-stack quiz web app where users are shown a 2026 World Cup player and must guess which country/national team they represent.

## Links

- **GitHub Repository:** https://github.com/sontran2204/github-demo-guessing-wc-player
- **Live Demo:** https://sontran2204.github.io/github-demo-guessing-wc-player/

## Features

- Random World Cup player each question
- Four country options with flag images
- Instant correct/incorrect feedback
- Score tracking across 10 questions
- Final score screen with restart option
- Responsive design for desktop and mobile

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (local) / PostgreSQL (production)
- **ORM:** Prisma
- **Data source:** [Zafronix WC API](https://api.zafronix.com/) (primary) with automatic fallback to [FIFA World Cup 2026 Dataset](https://github.com/mominullptr/FIFA-World-Cup-2026-Dataset) on GitHub

## Prerequisites

- Node.js 18+
- npm

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and edit as needed:

```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL="file:./dev.db"
ZAFRONIX_API_KEY="your-api-key-here"
PORT=3001
```

**Optional:** Get a free API key at [api.zafronix.com](https://api.zafronix.com/) (no credit card). If no key is set, the import script automatically uses the public GitHub dataset fallback.

### 3. Run database migration

```bash
npm run db:migrate
```

### 4. Import player data

```bash
npm run import:players
```

This fetches 2026 World Cup squads from the Zafronix API (or GitHub fallback) and stores ~1,248 players across 48 countries in the database.

### 5. Import player images (optional but recommended)

```bash
npm run import:images
```

Fetches player photos from Wikidata and Wikipedia and stores them in the database. Takes several minutes for all players. Players without a photo show initials as a fallback. Images are also fetched on-demand during the quiz if missing.

### 6. Start development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + player/country counts |
| GET | `/api/quiz/question?exclude=1,2,3` | Random player + 4 country options |
| POST | `/api/quiz/answer` | Validate answer `{ playerId, selectedCountryId }` |
| GET | `/api/quiz/stats` | Database stats |

## Project Structure

```
├── backend/
│   ├── prisma/schema.prisma    # Database schema
│   ├── scripts/import-players.ts  # Data import script
│   └── src/
│       ├── index.ts            # Express server
│       ├── routes/             # API routes
│       └── services/           # Quiz logic
└── frontend/
    └── src/
        ├── App.tsx             # Quiz state machine
        ├── api/client.ts       # API client
        └── components/         # UI components
```

## Deployment (GitHub Pages — recommended)

The app deploys as a **static site on GitHub Pages**. Quiz data is bundled in `frontend/public/data/quiz-data.json` (no backend server needed online).

### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy World Cup Player Guess"
git push origin main
```

### 2. Enable GitHub Pages

1. Open https://github.com/sontran2204/github-demo-guessing-wc-player/settings/pages
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. After the workflow runs, your site is live at:

**https://sontran2204.github.io/github-demo-guessing-wc-player/**

Each push to `main` triggers automatic redeploy via `.github/workflows/deploy-pages.yml`.

### 3. Refresh quiz data (after local DB changes)

```bash
npm run import:players
npm run classify:players
npm run import:images   # optional
npm run export:quiz-data
git add frontend/public/data/quiz-data.json
git commit -m "Update quiz data"
git push
```

## Local development with API (optional)

For local dev with Express + SQLite, use `npm run dev` as usual. GitHub Pages uses client-side quiz data instead.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend in dev mode |
| `npm run build` | Build both packages |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run import:players` | Fetch and import player data |
| `npm run import:images` | Fetch and import player photos |
| `npm run export:quiz-data` | Export JSON for GitHub Pages |
| `npm run classify:players` | Classify easy/medium/hard tiers |

## License

MIT
