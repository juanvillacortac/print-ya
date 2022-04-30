/*
  Warnings:

  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "published" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "storeId" TEXT,
    "public" BOOLEAN NOT NULL,
    "designImage" TEXT,
    "price" DECIMAL NOT NULL,
    "isTemplate" BOOLEAN NOT NULL,
    "template" TEXT,
    "templateDraft" TEXT,
    "storeCategoryId" TEXT,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_storeCategoryId_fkey" FOREIGN KEY ("storeCategoryId") REFERENCES "StoreCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "designImage", "id", "isTemplate", "name", "public", "published", "slug", "storeCategoryId", "storeId", "template", "templateDraft", "updatedAt") SELECT "createdAt", "designImage", "id", "isTemplate", "name", "public", "published", "slug", "storeCategoryId", "storeId", "template", "templateDraft", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
