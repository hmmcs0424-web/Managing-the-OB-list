import RegionAssignmentManager from "@/components/RegionAssignmentManager";
import { prisma } from "@/lib/db";

export default async function AdminRegionsPage() {
  const [agents, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "AGENT", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true },
    }),
    prisma.regionAssignment.findMany({
      select: { region: true, agentId: true },
    }),
  ]);

  return (
    <RegionAssignmentManager
      agents={agents}
      initialAssignments={assignments}
    />
  );
}
