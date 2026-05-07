-- Snapshot of the variant the shopper selected at sale time, plus the
-- per-unit upcharge (priceDelta) that variant added on top of the base
-- discounted price. Defaults to 0 / NULL so existing OrderItem rows keep
-- arithmetic and display stable.
ALTER TABLE "OrderItem"
  ADD COLUMN "selectedColor"     TEXT,
  ADD COLUMN "selectedStorage"   TEXT,
  ADD COLUMN "colorPriceDelta"   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "storagePriceDelta" DECIMAL(10, 2) NOT NULL DEFAULT 0;
