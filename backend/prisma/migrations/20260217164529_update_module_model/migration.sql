/*
  Warnings:

  - Added the required column `updatedAt` to the `Module` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Module" DROP CONSTRAINT "Module_convenorId_fkey";

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_convenorId_fkey" FOREIGN KEY ("convenorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
