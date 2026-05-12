-- Add shipping snapshot columns on orders, backfill from customer profile, then drop location from User.

ALTER TABLE "Order" ADD COLUMN "shippingAddress" TEXT,
ADD COLUMN "shippingCity" TEXT,
ADD COLUMN "shippingCountry" TEXT;

UPDATE "Order" AS o
SET
  "shippingAddress" = u."address",
  "shippingCity" = u."city",
  "shippingCountry" = u."country"
FROM "User" AS u
WHERE o."userId" = u."id";

ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "country";
