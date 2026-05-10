/*
  Warnings:

  - You are about to drop the column `customerName` on the `Bill` table. All the data in the column will be lost.
  - Made the column `dueDate` on table `Bill` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Bill" DROP CONSTRAINT "Bill_billerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_billerId_fkey";

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "customerName",
ALTER COLUMN "dueDate" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_billerId_fkey" FOREIGN KEY ("billerId") REFERENCES "Biller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_billerId_fkey" FOREIGN KEY ("billerId") REFERENCES "Biller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
