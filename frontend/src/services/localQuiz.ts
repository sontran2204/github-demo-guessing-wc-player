import type { AnswerResponse, Difficulty, QuestionResponse, QuizStats } from "../api/client";

interface QuizCountry {
  id: number;
  name: string;
  flagUrl: string | null;
}

interface QuizPlayer {
  id: number;
  name: string;
  position: string | null;
  club: string | null;
  imageUrl: string | null;
  countryId: number;
  difficulty: string;
}

interface QuizData {
  countries: QuizCountry[];
  players: QuizPlayer[];
}

let cache: Promise<QuizData> | null = null;

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function loadData(): Promise<QuizData> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/quiz-data.json`).then(async (response) => {
      if (!response.ok) {
        throw new Error("Quiz data not found. Run npm run export:quiz-data locally.");
      }
      return response.json() as Promise<QuizData>;
    });
  }
  return cache;
}

export async function localFetchStats(): Promise<QuizStats> {
  const data = await loadData();
  const easyCount = data.players.filter((p) => p.difficulty === "easy").length;
  const mediumCount = data.players.filter((p) => p.difficulty === "medium").length;
  const hardCount = data.players.filter((p) => p.difficulty === "hard").length;

  return {
    playerCount: data.players.length,
    countryCount: data.countries.length,
    easyCount,
    mediumCount,
    hardCount,
  };
}

export async function localFetchQuestion(
  excludeIds: number[],
  difficulty: Difficulty = "medium"
): Promise<QuestionResponse> {
  const data = await loadData();
  const exclude = new Set(excludeIds);

  let pool = data.players.filter((p) => p.difficulty === difficulty && !exclude.has(p.id));
  const withImage = pool.filter((p) => p.imageUrl);

  if (withImage.length >= 4) {
    pool = withImage;
  }

  if (pool.length === 0) {
    throw new Error(`No ${difficulty} players available. Try another difficulty.`);
  }

  const player = pool[Math.floor(Math.random() * pool.length)];
  const correctCountry = data.countries.find((c) => c.id === player.countryId);

  if (!correctCountry) {
    throw new Error("Player country not found.");
  }

  const wrongCountries = shuffle(data.countries.filter((c) => c.id !== player.countryId)).slice(0, 3);

  if (wrongCountries.length < 3) {
    throw new Error("Not enough countries for quiz options.");
  }

  const options = shuffle([correctCountry, ...wrongCountries]);

  return {
    player: {
      id: player.id,
      name: player.name,
      position: player.position,
      club: player.club,
      imageUrl: player.imageUrl,
    },
    options,
  };
}

export async function localSubmitAnswer(
  playerId: number,
  selectedCountryId: number
): Promise<AnswerResponse> {
  const data = await loadData();
  const player = data.players.find((p) => p.id === playerId);

  if (!player) {
    throw new Error("Player not found.");
  }

  const correctCountry = data.countries.find((c) => c.id === player.countryId);

  if (!correctCountry) {
    throw new Error("Player country not found.");
  }

  return {
    correct: player.countryId === selectedCountryId,
    correctCountry,
    player: {
      id: player.id,
      name: player.name,
      position: player.position,
      club: player.club,
      imageUrl: player.imageUrl,
    },
  };
}
