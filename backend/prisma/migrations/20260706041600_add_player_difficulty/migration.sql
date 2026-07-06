-- AlterTable
ALTER TABLE "Player" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'medium';

-- CreateIndex
CREATE INDEX "Player_difficulty_idx" ON "Player"("difficulty");
