-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "defaultBranch" TEXT,
ADD COLUMN     "lastCommitDate" TIMESTAMP(3),
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "totalCommits" INTEGER,
ADD COLUMN     "visibility" TEXT;
