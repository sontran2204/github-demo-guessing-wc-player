import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { normalizeStoredImageUrl } from "../src/lib/image-url";
import { fetchPlayerImageUrl, sleep } from "../src/services/player-image.service";

const DELAY_MS = 150;
const BATCH_SIZE = 50;

async function importPlayerImages() {
  const players = await prisma.player.findMany({
    include: { country: true },
    orderBy: { id: "asc" },
  });

  const toFetch = players.filter((p) => !p.imageUrl);

  if (toFetch.length === 0) {
    console.log("All players already have images.");
    return;
  }

  console.log(`Fetching images for ${toFetch.length} players from Wikidata/Wikipedia...`);

  let updated = 0;
  let missed = 0;

  for (let i = 0; i < toFetch.length; i++) {
    const player = toFetch[i];

    try {
      const imageUrl = await fetchPlayerImageUrl(player.name, player.country.name, player.club);

      if (imageUrl) {
        await prisma.player.update({
          where: { id: player.id },
          data: { imageUrl: normalizeStoredImageUrl(imageUrl) },
        });
        updated++;
      } else {
        missed++;
      }
    } catch {
      missed++;
    }

    if ((i + 1) % BATCH_SIZE === 0 || i === toFetch.length - 1) {
      console.log(`Progress: ${i + 1}/${toFetch.length} (${updated} found, ${missed} missed)`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`Image import complete: ${updated} images saved, ${missed} without image.`);
}

importPlayerImages()
  .catch((err) => {
    console.error("Image import failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
