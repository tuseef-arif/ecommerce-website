ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Product_isNewArrival_isActive_updatedAt_idx"
ON "Product" ("isNewArrival", "isActive", "updatedAt");
