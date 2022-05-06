-- AlterTable
ALTER TABLE "Product" ADD COLUMN "minQuantity" INTEGER;

-- CreateTable
CREATE TABLE "ProductModifier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userValueType" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "isLikeTax" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    CONSTRAINT "ProductModifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
