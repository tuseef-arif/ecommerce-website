-- Billing phone snapshot on orders (checkout + admin).
ALTER TABLE "Order" ADD COLUMN "shippingPhone" TEXT;

UPDATE "Order" AS o
SET "shippingPhone" = NULLIF(trim(u."phone"), '')
FROM "User" AS u
WHERE o."userId" = u."id";
