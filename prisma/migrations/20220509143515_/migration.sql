/*
  Warnings:

  - You are about to drop the column `isLikeTax` on the `ProductModifier` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `ProductModifier` table. All the data in the column will be lost.
  - You are about to drop the column `userValueType` on the `ProductModifier` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ProductModifierItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "percentage" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductModifier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'static',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT,
    CONSTRAINT "ProductModifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductModifier" ("active", "id", "name", "productId") SELECT "active", "id", "name", "productId" FROM "ProductModifier";
DROP TABLE "ProductModifier";
ALTER TABLE "new_ProductModifier" RENAME TO "ProductModifier";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
