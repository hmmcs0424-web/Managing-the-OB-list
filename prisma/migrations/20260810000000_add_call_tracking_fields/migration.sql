-- Add the fields already used by the application but missing from the initial migration.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Driver"
ADD COLUMN IF NOT EXISTS "doNotCall" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CallLog"
ADD COLUMN IF NOT EXISTS "dispatchSuccess" BOOLEAN NOT NULL DEFAULT false;

-- Lookup and today's activity are the two hottest paths in the app.
CREATE INDEX IF NOT EXISTS "CallLog_driverId_createdAt_idx" ON "CallLog"("driverId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CallLog_agentId_createdAt_idx" ON "CallLog"("agentId", "createdAt" DESC);
