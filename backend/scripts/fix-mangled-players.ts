import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { fetchPlayerImageUrl } from "../src/services/player-image.service";
import { PLAYER_NAME_ALIASES } from "../src/services/player-name-aliases";

async function fixMangledPlayers() {
  const badNames = Object.keys(PLAYER_NAME_ALIASES);
  let fixed = 0;
  let images = 0;
  let missed = 0;

  for (const badName of badNames) {
    const goodName = PLAYER_NAME_ALIASES[badName];
    const player = await prisma.player.findFirst({
      where: { name: badName },
      include: { country: true },
    });

    if (!player) {
      console.log(`Skip (not in DB): ${badName}`);
      continue;
    }

    const imageUrl = await fetchPlayerImageUrl(badName, player.country.name, player.club);

    await prisma.player.update({
      where: { id: player.id },
      data: {
        name: goodName,
        imageUrl,
      },
    });

    fixed++;
    if (imageUrl) images++;
    else missed++;

    console.log(`${badName} → ${goodName}: ${imageUrl ? "image OK" : "no image"}`);
  }

  console.log(`\nDone: ${fixed} names corrected, ${images} with images, ${missed} without image.`);
}

fixMangledPlayers()
  .catch((err) => {
    console.error("Fix failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
