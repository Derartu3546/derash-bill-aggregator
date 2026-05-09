/*
  Warnings:

  - You are about to drop the column `customerId` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_customerId_fkey";

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "customerId",
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- DropTable
DROP TABLE "Customer";
