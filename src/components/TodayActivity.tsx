"use client";

import { useCallback, useEffect } from "react";
import { useState } from "react";
import { STATUS_LABELS, STATUS_COLORS, type CallStatus } from "@/lib/status";

interface ActivityLog {
  id: string;
  status: CallStatus;
  memo: string | null;
  dispatchSuccess: boolean;
  createdAt: string;
  driver: {
    id: string;
    name: string;
    plate: string | null;
    phoneDisplay: string;
    doNotCall: boolean;
  };
}

export default function TodayActivity({ refreshKey }: { refreshKey: number }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/activity/today");
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const successCount = logs.filter((l) => l.dispatchSuccess).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">오늘 내가 처리한 목록</h2>
        <span className="text-sm text-slate-500">
          총 {logs.length}건 · 배차성공 {successCount}건
        </span>
      </div>

      {loading && <p className="text-sm text-slate-400">불러오는 중...</p>}
      {!loading && logs.length === 0 && (
        <p className="text-sm text-slate-400">오늘 처리한 항목이 없습니다.</p>
      )}

      <ul className="divide-y divide-slate-100">
        {logs.map((log) => (
          <li key={log.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
            <span className="font-medium text-slate-900">{log.driver.name}</span>
            {log.driver.plate && (
              <span className="text-slate-500">{log.driver.plate}</span>
            )}
            <span className="text-slate-500">{log.driver.phoneDisplay}</span>
            {log.driver.doNotCall && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                🚫 재전화 거부
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status]}`}
            >
              {STATUS_LABELS[log.status]}
            </span>
            {log.dispatchSuccess && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                배차성공
              </span>
            )}
            <span className="text-slate-400">
              {new Date(log.createdAt).toLocaleTimeString("ko-KR")}
            </span>
            {log.memo && <span className="text-slate-700">&ldquo;{log.memo}&rdquo;</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
