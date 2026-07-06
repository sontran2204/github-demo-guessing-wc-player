import { ConfettiCelebration } from "./ConfettiCelebration";
import type { Difficulty } from "../api/client";
import { DIFFICULTY_LABELS } from "../api/client";

interface ResultsScreenProps {
  score: number;
  totalQuestions: number;
  difficulty?: Difficulty;
  onRestart: () => void;
}

function getMessage(score: number, total: number): string {
  const pct = (score / total) * 100;
  if (pct === 100) return "Perfect! You're a World Cup expert!";
  if (pct >= 80) return "Excellent! You really know your players!";
  if (pct >= 60) return "Good job! Keep practicing!";
  if (pct >= 40) return "Not bad! Room to improve.";
  return "Keep learning — try again!";
}

export function ResultsScreen({ score, totalQuestions, difficulty, onRestart }: ResultsScreenProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const showConfetti = percentage >= 60;
  const modeLabel = difficulty ? DIFFICULTY_LABELS[difficulty].title : null;

  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      {showConfetti && <ConfettiCelebration key="results-confetti" />}
      <div className="text-6xl">🏆</div>
      <h2 className="text-2xl sm:text-3xl font-extrabold">Quiz Complete!</h2>
      {modeLabel && (
        <p className="text-sm text-slate-400 -mt-2">{modeLabel} mode</p>
      )}

      <div className="bg-slate-800/80 border border-slate-600 rounded-2xl px-10 py-8 w-full max-w-sm">
        <p className="text-5xl sm:text-6xl font-black text-emerald-400 mb-2">
          {score}/{totalQuestions}
        </p>
        <p className="text-slate-400 text-lg">{percentage}% correct</p>
      </div>

      <p className="text-slate-300 text-base sm:text-lg max-w-md">{getMessage(score, totalQuestions)}</p>

      <button
        onClick={onRestart}
        className="mt-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-emerald-500/25 min-h-[48px] min-w-[200px]"
      >
        Play Again
      </button>
    </div>
  );
}
