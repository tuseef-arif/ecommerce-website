-- CreateEnum
CREATE TYPE "ProductDiscountType" AS ENUM ('NONE', 'PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colorOptions" JSONB,
ADD COLUMN     "discountType" "ProductDiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "discountValue" DECIMAL(10,2),
ADD COLUMN     "isDiscountActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keyFeatures" JSONB,
ADD COLUMN     "productType" TEXT NOT NULL DEFAULT 'general';
