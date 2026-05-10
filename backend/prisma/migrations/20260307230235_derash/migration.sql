/*
  Warnings:

  - A unique constraint covering the columns `[billReference,period,billerId]` on the table `Bill` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Bill_billerId_billReference_period_key";

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billReference_period_billerId_key" ON "Bill"("billReference", "period", "billerId");
