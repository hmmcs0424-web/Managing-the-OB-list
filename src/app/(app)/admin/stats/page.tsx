import { getPerformanceStats } from "@/lib/stats";
import { currentKstMonthRange } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  const month = currentKstMonthRange();
  const validDate = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
  const from = validDate(params.from) ? params.from! : month.from;
  const to = validDate(params.to) ? params.to! : month.to;
  const stats = await getPerformanceStats(from, to);
  const rate = (total: number, success: number) => total === 0 ? "-" : `${Math.round((success / total) * 100)}%`;
  const memoTotal = stats.memoCategories.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-lg font-bold text-slate-900">실적 대시보드</h1><p className="mt-1 text-sm text-slate-500">기본 조회 기간은 이번 달 전체입니다.</p></div>
        <a href="/api/export" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">전체 Raw Data 엑셀</a>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-semibold text-slate-600">시작일<input type="date" name="from" defaultValue={from} className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="text-xs font-semibold text-slate-600">종료일<input type="date" name="to" defaultValue={to} className="mt-1 block rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
        <button type="submit" className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">조회</button>
        <a href="/admin/stats" className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">당월 전체</a>
        <span className="ml-auto text-sm text-slate-500">{from} ~ {to}</span>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric value={stats.total} label="선택 기간 총 처리 건수" />
        <Metric value={stats.success} label="배차 성공 건수" color="text-blue-600" />
        <Metric value={rate(stats.total, stats.success)} label="성공률" color="text-emerald-600" />
      </div>

      <StatsTable title="일자별 현황" empty={stats.daily.length === 0} headers={["일자", "처리 건수", "배차 성공", "성공률"]} rows={stats.daily.map((item) => [item.date, item.total, item.success, rate(item.total, item.success)])} />
      <StatsTable title="시간대별 현황" empty={stats.hourly.length === 0} headers={["시간대", "처리 건수", "배차 성공", "성공률"]} rows={stats.hourly.map((item) => [`${item.hour}시`, item.total, item.success, rate(item.total, item.success)])} />
      <StatsTable title="상담사별 현황" empty={stats.agents.length === 0} headers={["상담사", "OB 건수", "통화 고객 수", "배차 성공", "성공률"]} rows={stats.agents.map((item) => [item.agentName, item.total, item.customers, item.success, rate(item.total, item.success)])} />
      <StatsTable
        title="메모 사유별 현황"
        empty={stats.memoCategories.length === 0}
        headers={["사유", "건수", "비율"]}
        rows={stats.memoCategories.map((item) => [item.category, item.count, rate(memoTotal, item.count)])}
      />
    </div>
  );
}

function Metric({ value, label, color = "text-slate-900" }: { value: string | number; label: string; color?: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"><div className={`text-2xl font-bold ${color}`}>{value}</div><div className="mt-1 text-sm text-slate-500">{label}</div></div>;
}

function StatsTable({ title, empty, headers, rows }: { title: string; empty: boolean; headers: string[]; rows: (string | number)[][] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-slate-900">{title}</h2>
      {empty ? <p className="text-sm text-slate-400">선택 기간에 등록된 항목이 없습니다.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-slate-500">{headers.map((header) => <th key={header} className="py-2 pr-4">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${title}-${index}`} className="border-b border-slate-100">{row.map((cell, cellIndex) => <td key={cellIndex} className={`py-2 pr-4 ${cellIndex === 0 ? "font-medium text-slate-900" : ""}`}>{cell}</td>)}</tr>)}</tbody></table></div>}
    </section>
  );
}
