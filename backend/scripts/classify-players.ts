import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { classifyPlayer } from "../src/services/player-difficulty.service";

async function classifyPlayers() {
  const players = await prisma.player.findMany({
    select: { id: true, name: true, club: true },
  });

  let easy = 0;
  let medium = 0;
  let hard = 0;

  for (const player of players) {
    const difficulty = classifyPlayer(player.name, player.club);
    if (difficulty === "easy") easy++;
    else if (difficulty === "medium") medium++;
    else hard++;

    await prisma.player.update({
      where: { id: player.id },
      data: { difficulty },
    });
  }

  console.log(`Classified ${players.length} players:`);
  console.log(`  Easy: ${easy}`);
  console.log(`  Medium: ${medium}`);
  console.log(`  Hard: ${hard}`);
}

classifyPlayers()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
