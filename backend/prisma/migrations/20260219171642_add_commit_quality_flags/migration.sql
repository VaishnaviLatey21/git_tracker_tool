-- AlterTable
ALTER TABLE "Commit" ADD COLUMN     "isGenericMessage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSmallCommit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWhitespaceOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualityScore" INTEGER;
