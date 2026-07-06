# World Cup Player Guess

A full-stack quiz web app where users are shown a 2026 World Cup player and must guess which country/national team they represent.

## Links

- **GitHub Repository:** _(add your repo URL after pushing)_
- **Live Demo:** _(add your hosted URL after deploying)_

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

## Deployment (Render + GitHub)

### 1. Push to GitHub

```bash
cd "/path/to/Guess WC plaỷe"
git init
git add .
git commit -m "Add World Cup Player Guess quiz app"
git remote add origin https://github.com/YOUR_USERNAME/world-cup-player-guess.git
git push -u origin main
```

### 2. Create PostgreSQL database

Create a free PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com). Copy the connection string.

### 3. Update Prisma for production

In `backend/prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then create a new migration:

```bash
cd backend
DATABASE_URL="your-postgres-url" npx prisma migrate dev --name postgres
```

### 4. Deploy on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `npm install && npm run build -w backend && npm run build -w frontend && cd backend && npx prisma generate && npx prisma migrate deploy && npm run import:players`
   - **Start Command:** `npm run start -w backend`
   - **Environment Variables:**
     - `DATABASE_URL` — your PostgreSQL connection string
     - `ZAFRONIX_API_KEY` — your Zafronix API key (optional; fallback works without it)
     - `NODE_ENV=production`
4. Deploy and copy the public URL into this README

In production, the Express server serves the built frontend from `frontend/dist`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend in dev mode |
| `npm run build` | Build both packages |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run import:players` | Fetch and import player data |
| `npm run import:images` | Fetch and import player photos |

## License

MIT
