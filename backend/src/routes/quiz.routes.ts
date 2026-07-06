import { Router, Request, Response } from "express";
import { checkAnswer, getQuestion, getStats, isValidDifficulty } from "../services/quiz.service";

export const quizRouter = Router();

quizRouter.get("/question", async (req: Request, res: Response) => {
  try {
    const excludeParam = req.query.exclude as string | undefined;
    const excludeIds = excludeParam
      ? excludeParam.split(",").map(Number).filter((n) => !isNaN(n))
      : [];

    const difficultyParam = (req.query.difficulty as string | undefined) ?? "medium";
    const difficulty = isValidDifficulty(difficultyParam) ? difficultyParam : "medium";

    const question = await getQuestion(excludeIds, difficulty);
    res.json(question);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

quizRouter.post("/answer", async (req: Request, res: Response) => {
  try {
    const { playerId, selectedCountryId } = req.body;

    if (typeof playerId !== "number" || typeof selectedCountryId !== "number") {
      res.status(400).json({ error: "playerId and selectedCountryId are required numbers." });
      return;
    }

    const result = await checkAnswer(playerId, selectedCountryId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

quizRouter.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
