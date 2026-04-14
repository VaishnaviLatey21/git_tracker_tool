-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailOTP" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpExpiry" TIMESTAMP(3);
