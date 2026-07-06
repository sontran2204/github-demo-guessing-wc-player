import type { CountryOption, QuestionResponse } from "../api/client";
import { PlayerAvatar } from "./PlayerAvatar";

interface AnswerFeedback {
  correct: boolean;
  selectedId: number;
  correctCountryId: number;
}

interface QuizQuestionProps {
  question: QuestionResponse;
  onSelect: (countryId: number) => void;
  disabled?: boolean;
  selectedId?: number | null;
  feedback?: AnswerFeedback | null;
}

function formatPosition(position: string | null): string {
  if (!position) return "";
  const map: Record<string, string> = {
    GK: "Goalkeeper",
    DF: "Defender",
    MF: "Midfielder",
    FW: "Forward",
  };
  return map[position] ?? position;
}

export function QuizQuestion({ question, onSelect, disabled, selectedId, feedback }: QuizQuestionProps) {
  const { player, options } = question;
  const subtitle = [formatPosition(player.position), player.club].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center text-center gap-3 pb-1">
        <PlayerAvatar
          name={player.name}
          imageUrl={player.imageUrl}
          size={feedback ? "lg" : "xl"}
          zoomable={!feedback}
        />
        <div className="space-y-1">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">
            Which country does
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{player.name}</h2>
          {subtitle && <p className="text-slate-400 text-sm sm:text-base">{subtitle}</p>}
          <p className="text-slate-400 text-sm">play for?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map((option) => (
          <CountryButton
            key={option.id}
            option={option}
            onSelect={onSelect}
            disabled={disabled}
            selected={selectedId === option.id}
            feedback={feedback}
          />
        ))}
      </div>
    </div>
  );
}

function CountryButton({
  option,
  onSelect,
  disabled,
  selected,
  feedback,
}: {
  option: CountryOption;
  onSelect: (id: number) => void;
  disabled?: boolean;
  selected?: boolean;
  feedback?: AnswerFeedback | null;
}) {
  const isWrongPick = !!feedback && !feedback.correct && feedback.selectedId === option.id;
  const isCorrectPick = !!feedback && feedback.correct && feedback.selectedId === option.id;
  const isRevealedCorrect =
    !!feedback && !feedback.correct && feedback.correctCountryId === option.id;

  let stateClasses =
    "border-slate-600 bg-slate-800/60 hover:border-slate-400 hover:bg-slate-700/60";

  if (feedback) {
    if (isWrongPick) {
      stateClasses = "border-red-500 bg-red-500/20 text-red-100";
    } else if (isCorrectPick) {
      stateClasses = "border-emerald-400 bg-emerald-500/25";
    } else if (isRevealedCorrect) {
      stateClasses = "border-emerald-400/80 bg-emerald-500/15";
    } else {
      stateClasses = "border-slate-700 bg-slate-800/40 opacity-60";
    }
  } else if (selected) {
    stateClasses = "border-emerald-400 bg-emerald-500/20";
  }

  const animationClass = isWrongPick
    ? "animate-shake"
    : isCorrectPick
      ? "animate-correct-pop"
      : "";

  return (
    <button
      onClick={() => onSelect(option.id)}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 sm:px-4 sm:py-4 rounded-xl border-2 transition-colors min-h-[72px] sm:min-h-[80px] text-center
        ${stateClasses}
        ${animationClass}
        disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {option.flagUrl ? (
        <img
          src={option.flagUrl}
          alt=""
          className="w-9 h-6 sm:w-10 sm:h-7 object-cover rounded shadow-sm flex-shrink-0"
        />
      ) : (
        <span className="w-9 h-6 sm:w-10 sm:h-7 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
          🏳️
        </span>
      )}
      <span className="font-semibold text-white text-xs sm:text-base leading-tight line-clamp-2 w-full">
        {option.name}
      </span>
    </button>
  );
}
