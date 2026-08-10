import { getTodayStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const stats = await getTodayStats();
  const rate = (total: number, success: number) =>
    total === 0 ? "-" : `${Math.round((success / total) * 100)}%`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">오늘 실적 대시보드</h1>
        <div className="flex gap-2">
          <a
            href="/api/export"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            전체 Raw Data 엑셀
          </a>
          <a
            href="/admin/stats"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            새로고침
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[160px] rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="mt-1 text-sm text-slate-500">오늘 총 처리 건수</div>
        </div>
        <div className="flex-1 min-w-[160px] rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.success}</div>
          <div className="mt-1 text-sm text-slate-500">배차 성공 건수</div>
        </div>
        <div className="flex-1 min-w-[160px] rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">
            {rate(stats.total, stats.success)}
          </div>
          <div className="mt-1 text-sm text-slate-500">성공률</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-slate-900">시간대별 현황</h2>
        {stats.hourly.length === 0 ? (
          <p className="text-sm text-slate-400">오늘 등록된 항목이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">시간대</th>
                <th className="py-2">처리 건수</th>
                <th className="py-2">배차 성공</th>
                <th className="py-2">성공률</th>
              </tr>
            </thead>
            <tbody>
              {stats.hourly.map((h) => (
                <tr key={h.hour} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-900">{h.hour}시</td>
                  <td className="py-2">{h.total}</td>
                  <td className="py-2">{h.success}</td>
                  <td className="py-2">{rate(h.total, h.success)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-slate-900">상담사별 현황</h2>
        {stats.agents.length === 0 ? (
          <p className="text-sm text-slate-400">오늘 등록된 항목이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">상담사</th>
                <th className="py-2">OB 건수</th>
                <th className="py-2">통화 고객 수</th>
                <th className="py-2">배차 성공</th>
                <th className="py-2">성공률</th>
              </tr>
            </thead>
            <tbody>
              {stats.agents.map((a) => (
                <tr key={a.agentId} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-900">{a.agentName}</td>
                  <td className="py-2">{a.total}</td>
                  <td className="py-2">{a.customers}</td>
                  <td className="py-2">{a.success}</td>
                  <td className="py-2">{rate(a.total, a.success)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-slate-900">고객별 통화·배차 현황</h2>
        {stats.customers.length === 0 ? (
          <p className="text-sm text-slate-400">오늘 등록된 항목이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2">고객명</th>
                  <th className="py-2">차량번호</th>
                  <th className="py-2">전화번호</th>
                  <th className="py-2">통화 횟수</th>
                  <th className="py-2">배차 건수</th>
                </tr>
              </thead>
              <tbody>
                {stats.customers.map((customer) => (
                  <tr key={customer.driverId} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{customer.name}</td>
                    <td className="py-2">{customer.plate ?? "-"}</td>
                    <td className="py-2">{customer.phoneDisplay}</td>
                    <td className="py-2">{customer.total}</td>
                    <td className="py-2">{customer.success}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
