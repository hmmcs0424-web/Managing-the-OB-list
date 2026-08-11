"use client";

import { useCallback, useEffect } from "react";
import { useState } from "react";
import { CALL_STATUSES, STATUS_LABELS, STATUS_COLORS, type CallStatus } from "@/lib/status";

interface ActivityLog {
  id: string;
  status: CallStatus;
  memo: string | null;
  dispatchSuccess: boolean;
  createdAt: string;
  agent: { id: string; name: string };
  driver: {
    id: string;
    name: string;
    plate: string | null;
    phoneDisplay: string;
    doNotCall: boolean;
  };
}

interface AgentOption { id: string; name: string }

function todayInKorea() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export default function TodayActivity({
  refreshKey,
  currentUserId,
  role,
}: {
  refreshKey: number;
  currentUserId: string;
  role: "AGENT" | "ADMIN";
}) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [agentFilter, setAgentFilter] = useState("");
  const [fromDate, setFromDate] = useState(todayInKorea);
  const [toDate, setToDate] = useState(todayInKorea);
  const [successFilter, setSuccessFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterKey, setFilterKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (role === "ADMIN") {
        if (agentFilter) params.set("agentId", agentFilter);
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);
        if (successFilter) params.set("success", successFilter);
        if (statusFilter) params.set("status", statusFilter);
      }
      const res = await fetch(`/api/activity/today?${params}`);
      const data = (await res.json().catch(() => null)) as { logs?: ActivityLog[]; agents?: AgentOption[]; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "오늘 처리 목록을 불러오지 못했습니다.");
      setLogs(data?.logs ?? []);
      if (data?.agents) setAgents(data.agents);
    } catch (loadError) {
      setLogs([]);
      setError(loadError instanceof Error ? loadError.message : "오늘 처리 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [agentFilter, fromDate, role, statusFilter, successFilter, toDate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load, refreshKey, filterKey]);

  async function editMemo(log: ActivityLog) {
    const nextMemo = window.prompt("메모를 수정하세요.", log.memo ?? "");
    if (nextMemo === null) return;
    let payload: { memo: string; status?: CallStatus; dispatchSuccess?: boolean } = { memo: nextMemo };
    if (role === "ADMIN") {
      const nextStatus = window.prompt(
        "상태를 입력하세요: ACCEPTED(수락), REJECTED(거절), NO_ANSWER(부재중), PENDING(보류)",
        log.status
      );
      if (nextStatus === null) return;
      if (!CALL_STATUSES.includes(nextStatus as CallStatus)) {
        return window.alert("상태 값을 정확히 입력해주세요.");
      }
      payload = {
        memo: nextMemo,
        status: nextStatus as CallStatus,
        dispatchSuccess: window.confirm("배차 성공 기록이면 확인을 누르세요."),
      };
    }
    const res = await fetch(`/api/call-logs/${log.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return window.alert(data?.error ?? "메모 수정에 실패했습니다.");
    load();
  }

  async function deleteLog(logId: string) {
    if (!window.confirm("이 상담 기록을 삭제할까요?")) return;
    const res = await fetch(`/api/call-logs/${logId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) return window.alert(data?.error ?? "기록 삭제에 실패했습니다.");
    load();
  }

  const successCount = logs.filter((l) => l.dispatchSuccess).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">{role === "ADMIN" ? "전체 상담 기록" : "오늘 내가 처리한 목록"}</h2>
        <span className="text-sm text-slate-500">
          총 {logs.length}건 · 배차성공 {successCount}건
        </span>
      </div>

      {role === "ADMIN" && (
        <div className="mb-4 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="text-xs font-medium text-slate-600">상담사
            <select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
              <option value="">전체 상담사</option>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">시작일
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">종료일
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">성공여부
            <select value={successFilter} onChange={(event) => setSuccessFilter(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
              <option value="">전체</option><option value="true">배차성공</option><option value="false">미성공</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">통화상태
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm">
              <option value="">전체</option><option value="ACCEPTED">긍정</option><option value="REJECTED">거절</option><option value="NO_ANSWER">부재</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => setFilterKey((key) => key + 1)} className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">검색</button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">불러오는 중...</p>}
      {!loading && error && <p className="text-sm text-rose-600">{error}</p>}
      {!loading && !error && logs.length === 0 && (
        <p className="text-sm text-slate-400">오늘 처리한 항목이 없습니다.</p>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2.5">이름</th>
                <th className="px-3 py-2.5">차량번호</th>
                <th className="px-3 py-2.5">연락처</th>
                <th className="px-3 py-2.5">통화상태</th>
                <th className="px-3 py-2.5">성공여부</th>
                <th className="px-3 py-2.5">처리자</th>
                <th className="min-w-[180px] px-3 py-2.5">메모</th>
                <th className="px-3 py-2.5">처리시간</th>
                <th className="px-3 py-2.5">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="align-middle hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900">
                    {log.driver.name}
                    {log.driver.doNotCall && (
                      <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">
                        재전화 거부
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    {log.driver.plate ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    {log.driver.phoneDisplay}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status]}`}>
                      {STATUS_LABELS[log.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={log.dispatchSuccess ? "font-semibold text-blue-700" : "text-slate-400"}>
                      {log.dispatchSuccess ? "배차성공" : "-"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">{log.agent.name}</td>
                  <td className="max-w-[260px] px-3 py-3 text-slate-700">
                    <span className="block truncate" title={log.memo ?? ""}>{log.memo || "-"}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-400">
                    {role === "ADMIN" ? new Date(log.createdAt).toLocaleString("ko-KR") : new Date(log.createdAt).toLocaleTimeString("ko-KR")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex gap-1.5">
                      {(role === "ADMIN" || log.agent.id === currentUserId) && (
                        <button
                          type="button"
                          onClick={() => editMemo(log)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white"
                        >
                          {role === "ADMIN" ? "기록 수정" : "메모 수정"}
                        </button>
                      )}
                      {role === "ADMIN" && (
                        <button
                          type="button"
                          onClick={() => deleteLog(log.id)}
                          className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-white"
                        >
                          기록 삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
