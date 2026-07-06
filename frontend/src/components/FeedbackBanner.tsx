import type { AnswerResponse } from "../api/client";

interface FeedbackBannerProps {
  result: AnswerResponse;
  onNext: () => void;
  isLast: boolean;
}

export function FeedbackBanner({ result, onNext, isLast }: FeedbackBannerProps) {
  const { correct, correctCountry } = result;

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div
        className={`rounded-xl px-5 py-4 border-2 ${
          correct
            ? "bg-emerald-500/15 border-emerald-500/50"
            : "bg-red-500/15 border-red-500/50"
        }`}
      >
        <p className={`font-bold text-lg ${correct ? "text-emerald-400" : "text-red-400"}`}>
          {correct ? "Correct! 🎉" : "Incorrect"}
        </p>
        {!correct && (
          <p className="text-slate-300 mt-1 text-sm sm:text-base">
            {result.player.name} plays for{" "}
            <span className="font-semibold text-white inline-flex items-center gap-1.5">
              {correctCountry.flagUrl && (
                <img src={correctCountry.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded" />
              )}
              {correctCountry.name}
            </span>
          </p>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors min-h-[48px]"
      >
        {isLast ? "See Results" : "Next Question"}
      </button>
    </div>
  );
}
