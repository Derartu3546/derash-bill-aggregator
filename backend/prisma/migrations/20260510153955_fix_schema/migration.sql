/*
  Warnings:

  - The values [SUCCESS] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `metadata` on the `AgentEvent` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `errorCode` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `fee` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `initiatedBy` on the `Transaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiKey]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[derashRef]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - The required column `derashRef` was added to the `Transaction` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';
ALTER TYPE "PaymentMethod" ADD VALUE 'CARD';

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('INITIATED', 'SUCCESSFUL', 'FAILED', 'EXPIRED', 'CANCELLED', 'REVERSED', 'TIMEOUT', 'PENDING');
ALTER TABLE "public"."Transaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
ALTER TABLE "Transaction" ALTER COLUMN "status" SET DEFAULT 'INITIATED';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'BILLER_ADMIN';

-- DropForeignKey
ALTER TABLE "AgentEvent" DROP CONSTRAINT "AgentEvent_agentId_fkey";

-- DropIndex
DROP INDEX "Transaction_agentReference_idx";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AgentEvent" DROP COLUMN "metadata",
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "agentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "remainingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "Biller" ADD COLUMN     "accountNo" TEXT,
ADD COLUMN     "chargesLateFee" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gracePeriod" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "errorCode",
DROP COLUMN "errorMessage",
DROP COLUMN "fee",
DROP COLUMN "initiatedBy",
ADD COLUMN     "agentShare" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "aggregatorShare" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "billerShare" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "derashRef" TEXT NOT NULL,
ADD COLUMN     "rawResponse" JSONB,
ALTER COLUMN "status" SET DEFAULT 'INITIATED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "role" SET DEFAULT 'AGENT_USER';

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "email" TEXT,
    "phoneNo" VARCHAR(15) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phoneNo_key" ON "Customer"("phoneNo");

-- CreateIndex
CREATE INDEX "Customer_phoneNo_idx" ON "Customer"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_apiKey_key" ON "Agent"("apiKey");

-- CreateIndex
CREATE INDEX "Agent_code_idx" ON "Agent"("code");

-- CreateIndex
CREATE INDEX "Biller_code_idx" ON "Biller"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_derashRef_key" ON "Transaction"("derashRef");

-- CreateIndex
CREATE INDEX "Transaction_idempotencyKey_idx" ON "Transaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentEvent" ADD CONSTRAINT "AgentEvent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
