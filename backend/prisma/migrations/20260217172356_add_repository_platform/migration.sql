/*
  Warnings:

  - Added the required column `platform` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Repository" DROP CONSTRAINT "Repository_groupId_fkey";

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "platform" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
