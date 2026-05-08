-- Add customer address fields for admin customer module and checkout prefill.
ALTER TABLE "User"
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT;
