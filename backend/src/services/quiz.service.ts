import { prisma } from "../lib/prisma";
import { getDisplayName } from "./player-name-aliases";
import { type Difficulty, isValidDifficulty } from "./player-difficulty.service";

export interface CountryOption {
  id: number;
  name: string;
  flagUrl: string | null;
}

export interface QuestionResponse {
  player: {
    id: number;
    name: string;
    position: string | null;
    club: string | null;
    imageUrl: string | null;
  };
  options: CountryOption[];
}

export interface AnswerResponse {
  correct: boolean;
  correctCountry: CountryOption;
  player: {
    id: number;
    name: string;
    position: string | null;
    club: string | null;
    imageUrl: string | null;
  };
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function getQuestion(excludeIds: number[], difficulty: Difficulty = "medium"): Promise<QuestionResponse> {
  const excludeFilter = excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {};
  const difficultyFilter = { difficulty };

  const withImageCount = await prisma.player.count({
    where: { ...excludeFilter, ...difficultyFilter, imageUrl: { not: null } },
  });

  const totalCount = await prisma.player.count({ where: { ...excludeFilter, ...difficultyFilter } });

  if (totalCount === 0) {
    throw new Error(`No ${difficulty} players available. Try another difficulty or run import:players.`);
  }

  const preferWithImage = withImageCount >= 4;
  const where = preferWithImage
    ? { ...excludeFilter, ...difficultyFilter, imageUrl: { not: null } }
    : { ...excludeFilter, ...difficultyFilter };

  const poolCount = preferWithImage ? withImageCount : totalCount;
  const skip = Math.floor(Math.random() * poolCount);

  const player = await prisma.player.findFirst({
    where,
    skip,
    include: { country: true },
  });

  if (!player) {
    throw new Error("Failed to fetch a random player.");
  }

  const displayName = getDisplayName(player.name);

  // Return stored image only — avoid blocking the API on external image lookups.
  const imageUrl = player.imageUrl;

  const wrongCountries = await prisma.country.findMany({
    where: { id: { not: player.countryId } },
  });

  if (wrongCountries.length < 3) {
    throw new Error("Not enough countries in database for quiz options.");
  }

  const shuffledWrong = shuffle(wrongCountries).slice(0, 3);
  const options = shuffle([
    {
      id: player.country.id,
      name: player.country.name,
      flagUrl: player.country.flagUrl,
    },
    ...shuffledWrong.map((c) => ({
      id: c.id,
      name: c.name,
      flagUrl: c.flagUrl,
    })),
  ]);

  return {
    player: {
      id: player.id,
      name: displayName,
      position: player.position,
      club: player.club,
      imageUrl,
    },
    options,
  };
}

export async function checkAnswer(
  playerId: number,
  selectedCountryId: number
): Promise<AnswerResponse> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { country: true },
  });

  if (!player) {
    throw new Error("Player not found.");
  }

  const correct = player.countryId === selectedCountryId;

  return {
    correct,
    correctCountry: {
      id: player.country.id,
      name: player.country.name,
      flagUrl: player.country.flagUrl,
    },
    player: {
      id: player.id,
      name: getDisplayName(player.name),
      position: player.position,
      club: player.club,
      imageUrl: player.imageUrl,
    },
  };
}

export async function getStats() {
  const [playerCount, countryCount, easyCount, mediumCount, hardCount] = await Promise.all([
    prisma.player.count(),
    prisma.country.count(),
    prisma.player.count({ where: { difficulty: "easy" } }),
    prisma.player.count({ where: { difficulty: "medium" } }),
    prisma.player.count({ where: { difficulty: "hard" } }),
  ]);

  return { playerCount, countryCount, easyCount, mediumCount, hardCount };
}

export { isValidDifficulty, type Difficulty };
