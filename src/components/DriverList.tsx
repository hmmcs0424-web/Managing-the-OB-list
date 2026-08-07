"use client";

import { useCallback, useEffect, useState } from "react";
import { STATUS_LABELS, STATUS_COLORS, CALL_STATUSES, type CallStatus } from "@/lib/status";

interface DriverRow {
  id: string;
  name: string;
  plate: string | null;
  phoneDisplay: string;
  updatedAt: string;
  callCount: number;
  latest: {
    status: CallStatus;
    memo: string | null;
    agentName: string;
    createdAt: string;
  } | null;
}

interface DriverDetail {
  id: string;
  name: string;
  plate: string | null;
  phoneDisplay: string;
  callLogs: {
    id: string;
    status: CallStatus;
    memo: string | null;
    createdAt: string;
    agent: { name: string };
  }[];
}

export default function DriverList({ refreshKey }: { refreshKey: number }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DriverDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    const res = await fetch(`/api/drivers?${params.toString()}`);
    const data = await res.json();
    setDrivers(data.drivers ?? []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    const res = await fetch(`/api/drivers/${id}`);
    const data = await res.json();
    setDetail(data.driver ?? null);
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-slate-900">차주 목록 / 검색</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="이름 / 차량번호 / 전화번호 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">전체 상태</option>
          {CALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          검색
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">불러오는 중...</p>}

      {!loading && drivers.length === 0 && (
        <p className="text-sm text-slate-400">등록된 차주가 없습니다.</p>
      )}

      <div className="divide-y divide-slate-100">
        {drivers.map((d) => (
          <div key={d.id} className="py-3">
            <button
              onClick={() => toggleExpand(d.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">{d.name}</span>
                {d.plate && <span className="text-sm text-slate-500">{d.plate}</span>}
                <span className="text-sm text-slate-500">{d.phoneDisplay}</span>
                {d.callCount > 1 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    총 {d.callCount}회
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {d.latest && (
                  <>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.latest.status]}`}
                    >
                      {STATUS_LABELS[d.latest.status]}
                    </span>
                    <span className="text-slate-400">{d.latest.agentName}</span>
                  </>
                )}
              </div>
            </button>

            {expandedId === d.id && (
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                {!detail && <p className="text-slate-400">이력 불러오는 중...</p>}
                {detail && (
                  <ul className="space-y-2">
                    {detail.callLogs.map((log) => (
                      <li key={log.id} className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status]}`}
                        >
                          {STATUS_LABELS[log.status]}
                        </span>
                        <span className="text-slate-600">{log.agent.name}</span>
                        <span className="text-slate-400">
                          {new Date(log.createdAt).toLocaleString("ko-KR")}
                        </span>
                        {log.memo && <span className="text-slate-700">&ldquo;{log.memo}&rdquo;</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
