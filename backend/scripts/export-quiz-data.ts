import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/prisma";
import { getDisplayName } from "../src/services/player-name-aliases";

async function exportQuizData() {
  const [players, countries] = await Promise.all([
    prisma.player.findMany({
      select: {
        id: true,
        name: true,
        position: true,
        club: true,
        imageUrl: true,
        countryId: true,
        difficulty: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.country.findMany({
      select: { id: true, name: true, flagUrl: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    countries,
    players: players.map((player) => ({
      ...player,
      name: getDisplayName(player.name),
    })),
  };

  const outDir = join(__dirname, "../../frontend/public/data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "quiz-data.json");
  writeFileSync(outPath, JSON.stringify(payload));

  console.log(`Exported ${players.length} players and ${countries.length} countries to ${outPath}`);
}

exportQuizData()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
