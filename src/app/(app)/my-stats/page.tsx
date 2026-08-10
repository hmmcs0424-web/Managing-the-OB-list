import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { kstStartOfToday } from "@/lib/time";
import { STATUS_LABELS, type CallStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function MyStatsPage() {
  const session = await auth();
  const logs = await prisma.callLog.findMany({
    where: { agentId: session!.user.id, createdAt: { gte: kstStartOfToday() } },
    orderBy: { createdAt: "desc" },
    include: { driver: { select: { name: true, phoneDisplay: true } } },
  });
  const success = logs.filter((log) => log.dispatchSuccess).length;
  const customers = new Set(logs.map((log) => log.driverId)).size;
  const rate = logs.length ? Math.round((success / logs.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-slate-900">내 실적</h1><p className="mt-1 text-sm text-slate-500">오늘 처리한 OB 현황입니다.</p></div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[['OB 건수', logs.length], ['고객 수', customers], ['배차 성공', success], ['성공률', `${rate}%`]].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm"><div className="text-2xl font-bold text-slate-900">{value}</div><div className="mt-1 text-sm text-slate-500">{label}</div></div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">작성일시</th><th className="px-4 py-3">고객명</th><th className="px-4 py-3">연락처</th><th className="px-4 py-3">통화상태</th><th className="px-4 py-3">성공여부</th><th className="px-4 py-3">메모</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap px-4 py-3 text-slate-500">{log.createdAt.toLocaleString('ko-KR')}</td><td className="px-4 py-3 font-medium">{log.driver.name}</td><td className="px-4 py-3">{log.driver.phoneDisplay}</td><td className="px-4 py-3">{STATUS_LABELS[log.status as CallStatus]}</td><td className="px-4 py-3">{log.dispatchSuccess ? '배차성공' : '-'}</td><td className="px-4 py-3">{log.memo || '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
