ALTER TABLE "Driver"
ADD COLUMN IF NOT EXISTS "tonnage" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleType" TEXT;

-- Existing rows that were saved as PENDING while dispatch success was checked
-- are known successful dispatches and can be normalized safely.
UPDATE "CallLog"
SET "status" = 'ACCEPTED'
WHERE "status" = 'PENDING' AND "dispatchSuccess" = true;
