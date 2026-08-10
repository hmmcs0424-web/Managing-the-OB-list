import { prisma } from "@/lib/db";
import RegionManager from "@/components/RegionManager";

export const dynamic = "force-dynamic";

export default async function AdminRegionsPage() {
  const [users, assignments] = await Promise.all([
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.regionAssignment.findMany({ include: { agent: { select: { id: true, name: true } } } }),
  ]);
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-slate-900">지역 분배</h1><p className="mt-1 text-sm text-slate-500">지역 담당자와 상담사가 확인할 세부 정보를 관리합니다.</p></div>
      <RegionManager agents={users} initial={assignments} />
    </div>
  );
}
