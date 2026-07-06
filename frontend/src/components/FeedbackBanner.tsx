import type { AnswerResponse } from "../api/client";

interface FeedbackBannerProps {
  result: AnswerResponse;
  onNext: () => void;
  isLast: boolean;
}

export function FeedbackBanner({ result, onNext, isLast }: FeedbackBannerProps) {
  const { correct, correctCountry } = result;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700/80 bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-lg flex flex-col gap-3">
        <div
          className={`rounded-xl px-4 py-3 border ${
            correct
              ? "bg-emerald-500/15 border-emerald-500/50"
              : "bg-red-500/15 border-red-500/50"
          }`}
        >
          <p className={`font-bold text-base ${correct ? "text-emerald-400" : "text-red-400"}`}>
            {correct ? "Correct! 🎉" : "Incorrect"}
          </p>
          {!correct && (
            <p className="text-slate-300 mt-1 text-sm leading-snug">
              Plays for{" "}
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
          type="button"
          onClick={onNext}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors min-h-[48px] shadow-lg shadow-emerald-500/20"
        >
          {isLast ? "See Results" : "Next Question"}
        </button>
      </div>
    </div>
  );
}
