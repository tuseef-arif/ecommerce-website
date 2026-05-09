-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "voucherCode" TEXT,
ADD COLUMN     "voucherDiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
