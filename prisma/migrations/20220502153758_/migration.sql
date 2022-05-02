/*
  Warnings:

  - Added the required column `slug` to the `StoreCategory` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StoreCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "StoreCategory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StoreCategory" ("id", "name", "storeId") SELECT "id", "name", "storeId" FROM "StoreCategory";
DROP TABLE "StoreCategory";
ALTER TABLE "new_StoreCategory" RENAME TO "StoreCategory";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
