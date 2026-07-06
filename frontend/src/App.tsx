import { useCallback, useEffect, useState } from "react";
import {
  fetchQuestion,
  fetchStats,
  submitAnswer,
  type AnswerResponse,
  type Difficulty,
  type QuestionResponse,
  type QuizStats,
} from "./api/client";
import { FeedbackBanner } from "./components/FeedbackBanner";
import { ConfettiCelebration } from "./components/ConfettiCelebration";
import { QuizQuestion } from "./components/QuizQuestion";
import { ResultsScreen } from "./components/ResultsScreen";
import { ScoreBar } from "./components/ScoreBar";
import { StartScreen } from "./components/StartScreen";
import { preloadImage } from "./lib/imageCache";

const TOTAL_QUESTIONS = 10;

type Phase = "start" | "question" | "feedback" | "results";

export default function App() {
  const [phase, setPhase] = useState<Phase>("start");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [askedPlayerIds, setAskedPlayerIds] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResponse | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QuizStats | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  useEffect(() => {
    fetchStats()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const loadQuestion = useCallback(async (exclude: number[], mode: Difficulty) => {
    setLoadingQuestion(true);
    setError(null);
    try {
      const question = await fetchQuestion(exclude, mode);
      // Preload photo while UI updates so the card appears instantly when cached.
      void preloadImage(question.player.imageUrl);
      setCurrentQuestion(question);
      setSelectedId(null);
      setLastResult(null);
      setPhase("question");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load question");
    } finally {
      setLoadingQuestion(false);
    }
  }, []);

  const handleStart = (mode: Difficulty) => {
    setDifficulty(mode);
    setQuestionIndex(0);
    setScore(0);
    setAskedPlayerIds([]);
    loadQuestion([], mode);
  };

  const handleSelect = async (countryId: number) => {
    if (!currentQuestion || phase !== "question") return;

    setSelectedId(countryId);
    setSubmitting(true);

    try {
      const result = await submitAnswer(currentQuestion.player.id, countryId);
      setLastResult(result);
      if (result.correct) setScore((s) => s + 1);
      setAskedPlayerIds((ids) => [...ids, currentQuestion.player.id]);
      setPhase("feedback");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setLastResult(null);
    setSelectedId(null);

    const nextIndex = questionIndex + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      setPhase("results");
      return;
    }

    setQuestionIndex(nextIndex);
    loadQuestion([...askedPlayerIds], difficulty);
  };

  const handleChangeMode = () => {
    setPhase("start");
    setQuestionIndex(0);
    setScore(0);
    setAskedPlayerIds([]);
    setCurrentQuestion(null);
    setLastResult(null);
    setSelectedId(null);
    setError(null);
    setLoadingQuestion(false);
    setSubmitting(false);
  };

  const handleRestart = () => {
    setPhase("start");
    setQuestionIndex(0);
    setScore(0);
    setAskedPlayerIds([]);
    setCurrentQuestion(null);
    setLastResult(null);
    setSelectedId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg">
        <header className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
            FIFA World Cup 2026
          </p>
        </header>

        <main className="bg-slate-900/70 backdrop-blur border border-slate-700/60 rounded-3xl p-5 sm:p-8 shadow-2xl">
          {phase === "start" && (
            <StartScreen
              onStart={handleStart}
              loading={loadingQuestion}
              error={error}
              stats={stats}
            />
          )}

          {(phase === "question" || phase === "feedback") && currentQuestion && (
            <>
              {phase === "feedback" && lastResult?.correct && (
                <ConfettiCelebration key={`confetti-${currentQuestion.player.id}`} />
              )}
              <ScoreBar
                questionIndex={questionIndex + 1}
                totalQuestions={TOTAL_QUESTIONS}
                score={score}
                difficulty={difficulty}
                onChangeMode={handleChangeMode}
              />
              <QuizQuestion
                question={currentQuestion}
                onSelect={handleSelect}
                disabled={phase === "feedback" || submitting || loadingQuestion}
                selectedId={selectedId}
                feedback={
                  phase === "feedback" && lastResult && selectedId != null
                    ? {
                        correct: lastResult.correct,
                        selectedId,
                        correctCountryId: lastResult.correctCountry.id,
                      }
                    : null
                }
              />
              {phase === "feedback" && lastResult && (
                <FeedbackBanner
                  result={lastResult}
                  onNext={handleNext}
                  isLast={questionIndex + 1 >= TOTAL_QUESTIONS}
                />
              )}
            </>
          )}

          {phase === "results" && (
            <ResultsScreen
              score={score}
              totalQuestions={TOTAL_QUESTIONS}
              difficulty={difficulty}
              onRestart={handleRestart}
            />
          )}

          {loadingQuestion && phase === "question" && !currentQuestion && (
            <div className="text-center py-12 text-slate-400">Loading question...</div>
          )}
        </main>
      </div>
    </div>
  );
}
