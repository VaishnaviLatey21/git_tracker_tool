-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "inactivityDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "minExpectedCommits" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "smallCommitThreshold" INTEGER NOT NULL DEFAULT 5;
