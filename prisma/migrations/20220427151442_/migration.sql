/*
  Warnings:

  - You are about to drop the `_users_store` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `slug` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_users_store_B_index";

-- DropIndex
DROP INDEX "_users_store_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_users_store";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedByUserId" TEXT,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "favicon" TEXT,
    CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Store_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Store" ("createdAt", "favicon", "id", "logo", "name", "updatedAt", "updatedByUserId") SELECT "createdAt", "favicon", "id", "logo", "name", "updatedAt", "updatedByUserId" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
