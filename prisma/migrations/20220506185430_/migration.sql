-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductModifier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userValueType" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "isLikeTax" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT,
    CONSTRAINT "ProductModifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductModifier" ("id", "isLikeTax", "name", "price", "productId", "userValueType") SELECT "id", "isLikeTax", "name", "price", "productId", "userValueType" FROM "ProductModifier";
DROP TABLE "ProductModifier";
ALTER TABLE "new_ProductModifier" RENAME TO "ProductModifier";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
