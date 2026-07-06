import type { Difficulty, QuizStats } from "../api/client";
import { DIFFICULTY_LABELS } from "../api/client";

interface StartScreenProps {
  onStart: (difficulty: Difficulty) => void;
  loading?: boolean;
  error?: string | null;
  stats?: QuizStats;
}

const MODES: Difficulty[] = ["easy", "medium", "hard"];

export function StartScreen({ onStart, loading, error, stats }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-6">
      <div className="text-6xl mb-1">⚽</div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        World Cup Player Guess
      </h1>
      <p className="text-slate-300 max-w-md text-base sm:text-lg leading-relaxed">
        Guess which country a 2026 World Cup player represents. Pick a difficulty and answer 10
        questions!
      </p>

      <div className="w-full grid grid-cols-1 gap-3 mt-1">
        {MODES.map((mode) => {
          const label = DIFFICULTY_LABELS[mode];
          const count =
            mode === "easy"
              ? stats?.easyCount
              : mode === "medium"
                ? stats?.mediumCount
                : stats?.hardCount;

          return (
            <button
              key={mode}
              onClick={() => onStart(mode)}
              disabled={loading}
              className="flex items-center gap-4 rounded-2xl border-2 border-slate-600 bg-slate-800/60 px-4 py-4 text-left transition-colors hover:border-emerald-400/70 hover:bg-slate-700/70 disabled:opacity-60 disabled:cursor-not-allowed min-h-[72px]"
            >
              <span className="text-3xl shrink-0">{label.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-white text-lg">{label.title}</span>
                <span className="block text-slate-400 text-sm">{label.subtitle}</span>
                {count !== undefined && (
                  <span className="block text-emerald-400/90 text-xs mt-1">
                    {count.toLocaleString()} players
                  </span>
                )}
              </span>
              <span className="text-slate-500 text-xl shrink-0">→</span>
            </button>
          );
        })}
      </div>

      {stats && stats.playerCount > 0 && (
        <p className="text-sm text-slate-500">
          {stats.playerCount.toLocaleString()} players · {stats.countryCount} countries
        </p>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl px-4 py-3 text-sm max-w-md">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading question...</p>}
    </div>
  );
}
