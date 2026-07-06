import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { quizRouter } from "./routes/quiz.routes";
import { getStats } from "./services/quiz.service";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const stats = await getStats();
    res.json({
      status: "ok",
      ...stats,
    });
  } catch {
    res.status(503).json({ status: "error", message: "Database unavailable" });
  }
});

app.use("/api/quiz", quizRouter);

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
