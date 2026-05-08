-- Capture full mandatory address details during signup OTP flow.
ALTER TABLE "SignupOtpChallenge"
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "country" TEXT;

UPDATE "SignupOtpChallenge"
SET
  "address" = COALESCE("address", ''),
  "city" = COALESCE("city", ''),
  "country" = COALESCE("country", '');

ALTER TABLE "SignupOtpChallenge"
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL;
