/*
  Warnings:

  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "storeId" TEXT,
    "public" BOOLEAN NOT NULL,
    "description" TEXT,
    "designImage" TEXT,
    "price" REAL NOT NULL,
    "isTemplate" BOOLEAN NOT NULL,
    "template" TEXT,
    "templateDraft" TEXT,
    "storeCategoryId" TEXT,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_storeCategoryId_fkey" FOREIGN KEY ("storeCategoryId") REFERENCES "StoreCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "designImage", "id", "isTemplate", "name", "price", "public", "slug", "storeCategoryId", "storeId", "template", "templateDraft", "updatedAt") SELECT "createdAt", "description", "designImage", "id", "isTemplate", "name", "price", "public", "slug", "storeCategoryId", "storeId", "template", "templateDraft", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
