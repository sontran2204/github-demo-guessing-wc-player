import "dotenv/config";
import { normalizeStoredImageUrl } from "../src/lib/image-url";
import { prisma } from "../src/lib/prisma";

async function shrinkExistingUrls() {
  const players = await prisma.player.findMany({
    where: { imageUrl: { not: null } },
    select: { id: true, imageUrl: true },
  });

  let updated = 0;
  for (const player of players) {
    if (!player.imageUrl) continue;
    const normalized = normalizeStoredImageUrl(player.imageUrl);
    if (normalized !== player.imageUrl) {
      await prisma.player.update({
        where: { id: player.id },
        data: { imageUrl: normalized },
      });
      updated++;
    }
  }

  console.log(`Normalized ${updated} image URLs to smaller size.`);
}

shrinkExistingUrls()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
