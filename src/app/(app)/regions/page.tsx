import { prisma } from "@/lib/db";
import { REGIONS } from "@/lib/regions";

export const dynamic = "force-dynamic";

export default async function RegionsPage() {
  const assignments = await prisma.regionAssignment.findMany({ include: { agent: { select: { name: true } } } });
  const byRegion = new Map(assignments.map((item) => [item.region, item]));
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-slate-900">지역 확인</h1><p className="mt-1 text-sm text-slate-500">지역별 담당 상담사와 세부 정보를 확인합니다.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {REGIONS.map((region) => {
          const item = byRegion.get(region);
          return <section key={region} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-bold text-slate-900">{region}</h2><p className="mt-2 text-sm text-slate-600">담당: {item?.agent?.name ?? "미배정"}</p><p className="mt-1 min-h-10 whitespace-pre-wrap text-sm text-slate-500">{item?.detail || "등록된 세부 정보가 없습니다."}</p></section>;
        })}
      </div>
    </div>
  );
}
