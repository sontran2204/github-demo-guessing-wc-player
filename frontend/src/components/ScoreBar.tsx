import type { Difficulty } from "../api/client";
import { DIFFICULTY_LABELS } from "../api/client";

interface ScoreBarProps {
  questionIndex: number;
  totalQuestions: number;
  score: number;
  difficulty?: Difficulty;
  onChangeMode?: () => void;
}

export function ScoreBar({
  questionIndex,
  totalQuestions,
  score,
  difficulty,
  onChangeMode,
}: ScoreBarProps) {
  const progress = (questionIndex / totalQuestions) * 100;
  const modeLabel = difficulty ? DIFFICULTY_LABELS[difficulty].title : null;

  return (
    <div className="w-full mb-6">
      {onChangeMode && (
        <button
          type="button"
          onClick={onChangeMode}
          className="mb-3 text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Change mode
        </button>
      )}
      <div className="flex justify-between items-center text-sm font-medium text-slate-300 mb-2 gap-2">
        <span>
          Question {questionIndex}/{totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          {modeLabel && (
            <span className="rounded-full bg-slate-700/80 px-2.5 py-0.5 text-xs text-slate-300">
              {modeLabel}
            </span>
          )}
          <span className="text-emerald-400">Score: {score}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
