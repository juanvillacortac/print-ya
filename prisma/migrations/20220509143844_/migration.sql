-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductModifier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'select',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT,
    CONSTRAINT "ProductModifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductModifier" ("active", "id", "name", "productId", "type") SELECT "active", "id", "name", "productId", "type" FROM "ProductModifier";
DROP TABLE "ProductModifier";
ALTER TABLE "new_ProductModifier" RENAME TO "ProductModifier";
CREATE TABLE "new_ProductModifierItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "percentage" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "productModifierId" TEXT,
    CONSTRAINT "ProductModifierItem_productModifierId_fkey" FOREIGN KEY ("productModifierId") REFERENCES "ProductModifier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductModifierItem" ("active", "cost", "id", "name", "percentage") SELECT "active", "cost", "id", "name", "percentage" FROM "ProductModifierItem";
DROP TABLE "ProductModifierItem";
ALTER TABLE "new_ProductModifierItem" RENAME TO "ProductModifierItem";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
