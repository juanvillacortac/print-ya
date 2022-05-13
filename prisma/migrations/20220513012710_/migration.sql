/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `Store` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_customDomain_key" ON "Store"("customDomain");
