import Dashboard from "@/components/Dashboard";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REGIONS, type Province } from "@/lib/regions";

export default async function HomePage() {
  const session = await auth();
  const assignedRegions = session!.user.role === "ADMIN"
    ? REGIONS
    : (await prisma.regionAssignment.findMany({ where: { agentId: session!.user.id }, orderBy: { region: "asc" }, select: { region: true } }))
        .map((item) => item.region)
        .filter((region): region is Province => REGIONS.includes(region as Province));
  return <Dashboard currentUserId={session!.user.id} currentUserName={session!.user.name ?? "상담사"} role={session!.user.role} assignedRegions={assignedRegions} />;
}
