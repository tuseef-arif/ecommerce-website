ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "isOnSale" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Product_isOnSale_isActive_updatedAt_idx"
ON "Product" ("isOnSale", "isActive", "updatedAt");
