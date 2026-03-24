/*
  Warnings:

  - You are about to drop the column `period` on the `Bill` table. All the data in the column will be lost.
  - Made the column `due_date` on table `Bill` required. This step will fail if there are existing NULL values in that column.
  - Made the column `payer_phone` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "period",
ALTER COLUMN "due_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "payer_phone" SET NOT NULL;
