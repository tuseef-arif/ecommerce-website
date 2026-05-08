-- Add payment method enum + column to Order, with COD default so existing rows stay safe.
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'SELF_COLLECTION', 'COD');

ALTER TABLE "Order"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD';

CREATE INDEX "Order_paymentMethod_idx" ON "Order"("paymentMethod");
