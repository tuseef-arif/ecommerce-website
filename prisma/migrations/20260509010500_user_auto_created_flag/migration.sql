-- Mark system-generated guest-checkout users.
ALTER TABLE "User"
ADD COLUMN "autoCreated" BOOLEAN NOT NULL DEFAULT false;
