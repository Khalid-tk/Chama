/*
  Warnings:

  - A unique constraint covering the columns `[chamaCode]` on the table `chamas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chamaCode` to the `chamas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chamas" ADD COLUMN     "chamaCode" TEXT NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinCode" TEXT,
ADD COLUMN     "joinMode" "JoinMode" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "mpesa_payments" ADD COLUMN     "loanId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chamas_chamaCode_key" ON "chamas"("chamaCode");
