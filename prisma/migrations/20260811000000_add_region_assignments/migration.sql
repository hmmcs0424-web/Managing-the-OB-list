CREATE TABLE "RegionAssignment" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "detail" TEXT,
    "agentId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegionAssignment_region_key" ON "RegionAssignment"("region");
CREATE INDEX "RegionAssignment_agentId_idx" ON "RegionAssignment"("agentId");

ALTER TABLE "RegionAssignment"
ADD CONSTRAINT "RegionAssignment_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
