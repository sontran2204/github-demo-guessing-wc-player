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

export type Difficulty = "easy" | "medium" | "hard";

const API_BASE = "/api";

export const DIFFICULTY_LABELS: Record<
  Difficulty,
  { title: string; subtitle: string; emoji: string }
> = {
  easy: {
    title: "Easy",
    subtitle: "World stars & top clubs",
    emoji: "⭐",
  },
  medium: {
    title: "Medium",
    subtitle: "Mix of well-known players",
    emoji: "⚽",
  },
  hard: {
    title: "Hard",
    subtitle: "Lesser-known squad players",
    emoji: "🔥",
  },
};

export interface QuizStats {
  playerCount: number;
  countryCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchQuestion(
  excludeIds: number[],
  difficulty: Difficulty = "medium"
): Promise<QuestionResponse> {
  const params = new URLSearchParams({ difficulty });
  if (excludeIds.length > 0) params.set("exclude", excludeIds.join(","));
  const response = await fetch(`${API_BASE}/quiz/question?${params}`);
  return handleResponse<QuestionResponse>(response);
}

export async function submitAnswer(
  playerId: number,
  selectedCountryId: number
): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE}/quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, selectedCountryId }),
  });
  return handleResponse<AnswerResponse>(response);
}

export async function fetchStats(): Promise<QuizStats> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse(response);
}
