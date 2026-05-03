/*
  Warnings:

  - A unique constraint covering the columns `[bill_reference,biller_id]` on the table `Bill` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Bill_period_key";

-- CreateIndex
CREATE UNIQUE INDEX "Bill_bill_reference_biller_id_key" ON "Bill"("bill_reference", "biller_id");
