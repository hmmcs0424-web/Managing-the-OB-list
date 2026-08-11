"use client";

import { useRef, useState } from "react";
import { parsePasteText } from "@/lib/parse";
import { formatPhoneDisplay } from "@/lib/phone";
import { STATUS_LABELS, STATUS_COLORS, ENTRY_CALL_STATUSES, type CallStatus } from "@/lib/status";
import { TONNAGE_OPTIONS, VEHICLE_TYPE_OPTIONS } from "@/lib/vehicle";

interface HistoryEntry {
  id: string;
  agentId: string;
  status: CallStatus;
  memo: string | null;
  agentName: string;
  createdAt: string;
}

interface CheckResult {
  raw: string;
  name?: string;
  plate?: string;
  phoneRaw?: string;
  phoneNormalized?: string;
  phoneDisplay?: string;
  error?: string;
  kind: "new" | "duplicate" | "error";
  driverId?: string;
  existing?: {
    name: string;
    plate: string | null;
    tonnage: string | null;
    vehicleType: string | null;
    doNotCall: boolean;
    callCount: number;
    history: HistoryEntry[];
  };
}

interface SearchDriver {
  id: string;
  name: string;
  plate: string | null;
  tonnage: string | null;
  vehicleType: string | null;
  phoneDisplay: string;
  doNotCall: boolean;
  callCount: number;
  latest: {
    status: CallStatus;
    memo: string | null;
    agentName: string;
    createdAt: string;
  } | null;
}

export default function QuickEntry({
  onRegistered,
  currentUserId,
  role,
}: {
  onRegistered: () => void;
  currentUserId: string;
  role: "AGENT" | "ADMIN";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<"idle" | "register" | "search">("idle");
  const [entry, setEntry] = useState<CheckResult | null>(null);
  const [searchResults, setSearchResults] = useState<SearchDriver[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<HistoryEntry[] | null>(null);

  const [status, setStatus] = useState<CallStatus>("ACCEPTED");
  const [tonnage, setTonnage] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [doNotCall, setDoNotCall] = useState(false);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setStatus("ACCEPTED");
    setTonnage("");
    setVehicleType("");
    setDoNotCall(false);
    setMemo("");
  }

  async function handleLookup() {
    const text = value.trim();
    if (!text) return;
    setLoading(true);
    setMessage(null);
    setEntry(null);
    setSearchResults([]);
    setExpandedId(null);

    const rows = parsePasteText(text);
    const row = rows[0];
    const immediateEntry: CheckResult | null = row && !row.error
      ? {
          ...row,
          phoneDisplay: formatPhoneDisplay(row.phoneRaw!),
          kind: "new",
        }
      : null;

    // A valid new entry can be recorded immediately while duplicate history is checked.
    if (immediateEntry) {
      setEntry(immediateEntry);
      setMode("register");
      resetForm();
    }

    try {
      if (immediateEntry) {
        const res = await fetch("/api/entries/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = (await res.json().catch(() => null)) as
          | { results?: CheckResult[]; error?: string }
          | null;
        const result = data?.results?.[0];
        if (!res.ok || !result) throw new Error(data?.error || "조회에 실패했습니다.");
        setEntry(result);
        setMode("register");
        resetForm();
        if (result.kind === "duplicate" && result.existing) {
          setDoNotCall(result.existing.doNotCall);
          setTonnage(result.existing.tonnage ?? "");
          setVehicleType(result.existing.vehicleType ?? "");
        }
      } else {
        const res = await fetch(`/api/drivers?q=${encodeURIComponent(text)}`);
        const data = (await res.json().catch(() => null)) as
          | { drivers?: SearchDriver[]; error?: string }
          | null;
        if (!res.ok) throw new Error(data?.error || "검색에 실패했습니다.");
        setSearchResults(data?.drivers ?? []);
        setMode("search");
      }
    } catch (error) {
      if (!immediateEntry) setMode("idle");
      setMessage(
        immediateEntry
          ? "기존 이력 확인이 지연되고 있습니다. 기록은 계속 작성할 수 있습니다."
          : error instanceof Error
            ? error.message
            : "조회에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLookup();
    }
  }

  async function handleRegister() {
    if (!entry || entry.kind === "error") return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            {
              name: entry.name,
              plate: entry.plate,
              tonnage,
              vehicleType,
              phoneRaw: entry.phoneRaw,
              phoneNormalized: entry.phoneNormalized,
              memo,
              status,
              doNotCall,
            },
          ],
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMessage(data?.error ?? "등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setMessage("등록 완료");
      setValue("");
      setMode("idle");
      setEntry(null);
      resetForm();
      onRegistered();
      inputRef.current?.focus();
    } catch {
      setMessage("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleExpand(driverId: string) {
    if (expandedId === driverId) {
      setExpandedId(null);
      setExpandedHistory(null);
      return;
    }
    setExpandedId(driverId);
    setExpandedHistory(null);
    const res = await fetch(`/api/drivers/${driverId}`);
    const data = await res.json();
    setExpandedHistory(
      (data.driver?.callLogs ?? []).map(
        (log: {
          id: string;
          status: CallStatus;
          memo: string | null;
          createdAt: string;
          agent: { id: string; name: string };
        }) => ({
          id: log.id,
          agentId: log.agent.id,
          status: log.status,
          memo: log.memo,
          agentName: log.agent.name,
          createdAt: log.createdAt,
        })
      )
    );
  }

  async function editMemo(log: HistoryEntry) {
    const nextMemo = window.prompt("메모를 수정하세요.", log.memo ?? "");
    if (nextMemo === null) return;
    let payload: { memo: string; status?: CallStatus } = { memo: nextMemo };
    if (role === "ADMIN") {
      const nextStatus = window.prompt(
        "상태를 입력하세요: ACCEPTED(배차 성공), REJECTED(매칭 실패), NO_ANSWER(부재)",
        log.status
      );
      if (nextStatus === null) return;
      if (!(ENTRY_CALL_STATUSES as readonly string[]).includes(nextStatus)) {
        return window.alert("상태 값을 정확히 입력해주세요.");
      }
      payload = {
        memo: nextMemo,
        status: nextStatus as CallStatus,
      };
    }
    const res = await fetch(`/api/call-logs/${log.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return window.alert(data?.error ?? "메모 수정에 실패했습니다.");
    handleLookup();
  }

  async function deleteLog(logId: string) {
    if (!window.confirm("이 상담 기록을 삭제할까요?")) return;
    const res = await fetch(`/api/call-logs/${logId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) return window.alert(data?.error ?? "기록 삭제에 실패했습니다.");
    handleLookup();
  }

  async function editDriver(driver: SearchDriver) {
    const name = window.prompt("차주 이름", driver.name);
    if (name === null) return;
    const plate = window.prompt("차량번호", driver.plate ?? "");
    if (plate === null) return;
    const phone = window.prompt("전화번호", driver.phoneDisplay);
    if (phone === null) return;
    const nextTonnage = window.prompt("차량 톤수", driver.tonnage ?? "");
    if (nextTonnage === null) return;
    const nextVehicleType = window.prompt("차종", driver.vehicleType ?? "");
    if (nextVehicleType === null) return;
    const res = await fetch(`/api/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plate, phone, tonnage: nextTonnage, vehicleType: nextVehicleType, doNotCall: driver.doNotCall }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return window.alert(data?.error ?? "차주 정보 수정에 실패했습니다.");
    handleLookup();
  }

  async function releaseDoNotCall(driver: SearchDriver) {
    if (!window.confirm(`${driver.name} 차주의 재전화 거부를 해제할까요?`)) return;
    const res = await fetch(`/api/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: driver.name,
        plate: driver.plate,
        phone: driver.phoneDisplay,
        tonnage: driver.tonnage,
        vehicleType: driver.vehicleType,
        doNotCall: false,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return window.alert(data?.error ?? "재전화 거부 해제에 실패했습니다.");
    handleLookup();
  }

  async function deleteDriver(driver: SearchDriver) {
    if (!window.confirm(`${driver.name} 차주와 모든 상담 기록을 삭제할까요?`)) return;
    const res = await fetch(`/api/drivers/${driver.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) return window.alert(data?.error ?? "차주 삭제에 실패했습니다.");
    setExpandedId(null);
    handleLookup();
    onRegistered();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-base font-bold text-slate-900">차주 조회 / 등록</h2>
      <p className="mb-3 text-sm text-slate-500">
        <span className="font-medium">이름, 차량번호, 전화번호</span>를 붙여넣고 Enter — 신규면
        등록 화면이, 기존이면 이력이 바로 뜹니다. 이름/번호 일부만 입력하면 검색됩니다.
      </p>
      <input
        ref={inputRef}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder="정지영, 제주90바1417, 01012345678"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      {loading && <p className="mt-2 text-sm text-slate-400">조회 중...</p>}

      {mode === "register" && entry && entry.kind !== "error" && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-slate-900">
              {entry.name}
              {entry.plate ? ` · ${entry.plate}` : ""}
              {entry.phoneDisplay ? ` · ${entry.phoneDisplay}` : ""}
            </span>
            {entry.kind === "new" && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                신규 차주
              </span>
            )}
            {entry.kind === "duplicate" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                이력 {entry.existing?.callCount}회
              </span>
            )}
            {doNotCall && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                🚫 재전화 거부
              </span>
            )}
          </div>

          {entry.kind === "duplicate" && entry.existing && entry.existing.history.length > 0 && (
            <div className="mb-4 rounded-lg bg-slate-50 p-3">
              <div className="mb-2 text-xs font-semibold text-slate-500">이전 통화 이력</div>
              <ul className="space-y-1.5 text-sm">
                {entry.existing.history.map((log) => (
                  <li key={log.id} className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status]}`}
                    >
                      {STATUS_LABELS[log.status]}
                    </span>
                    <span className="text-slate-600">작성자: {log.agentName}</span>
                    <span className="text-slate-400">
                      {new Date(log.createdAt).toLocaleString("ko-KR")}
                    </span>
                    {log.memo && <span className="text-slate-700">&ldquo;{log.memo}&rdquo;</span>}
                    {(role === "ADMIN" || log.agentId === currentUserId) && (
                      <button type="button" onClick={() => editMemo(log)} className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
                        {role === "ADMIN" ? "기록 수정" : "메모 수정"}
                      </button>
                    )}
                    {role === "ADMIN" && (
                      <button type="button" onClick={() => deleteLog(log.id)} className="rounded border border-rose-300 px-2 py-0.5 text-xs text-rose-600">
                        기록 삭제
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as CallStatus)}
            >
              {ENTRY_CALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select value={tonnage} onChange={(e) => setTonnage(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">톤수 선택</option>
              {TONNAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">차종 선택</option>
              {VEHICLE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-rose-600">
              <input
                type="checkbox"
                checked={doNotCall}
                onChange={(e) => setDoNotCall(e.target.checked)}
                disabled={entry.existing?.doNotCall === true && role !== "ADMIN"}
              />
              {entry.existing?.doNotCall && role === "ADMIN" ? "재전화 거부 해제 가능" : "재전화 거부로 표시"}
            </label>
            <input
              className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              placeholder="메모 (선택)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={submitting}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "등록 중..." : entry.kind === "duplicate" ? "추가 등록" : "등록"}
          </button>
        </div>
      )}

      {mode === "register" && entry?.kind === "error" && (
        <p className="mt-3 text-sm text-rose-600">{entry.error}</p>
      )}

      {mode === "search" && (
        <div className="mt-4">
          {searchResults.length === 0 ? (
            <p className="text-sm text-slate-400">검색 결과가 없습니다.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.map((d) => (
                <div key={d.id} className="py-2.5">
                  <button
                    onClick={() => toggleExpand(d.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{d.name}</span>
                      {d.plate && <span className="text-sm text-slate-500">{d.plate}</span>}
                      {d.tonnage && <span className="text-sm text-slate-500">{d.tonnage}</span>}
                      {d.vehicleType && <span className="text-sm text-slate-500">{d.vehicleType}</span>}
                      <span className="text-sm text-slate-500">{d.phoneDisplay}</span>
                      {d.callCount > 1 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          총 {d.callCount}회
                        </span>
                      )}
                      {d.doNotCall && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                          🚫 재전화 거부
                        </span>
                      )}
                    </div>
                    {d.latest && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.latest.status]}`}
                      >
                        {STATUS_LABELS[d.latest.status]}
                      </span>
                    )}
                  </button>
                  {role === "ADMIN" && (
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => editDriver(d)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                        차주 정보 수정
                      </button>
                      {d.doNotCall && <button type="button" onClick={() => releaseDoNotCall(d)} className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">재전화 거부 해제</button>}
                      <button type="button" onClick={() => deleteDriver(d)} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50">
                        차주 전체 삭제
                      </button>
                    </div>
                  )}
                  {expandedId === d.id && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                      {!expandedHistory && <p className="text-slate-400">불러오는 중...</p>}
                      {expandedHistory && (
                        <ul className="space-y-1.5">
                          {expandedHistory.map((log) => (
                            <li key={log.id} className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status]}`}
                              >
                                {STATUS_LABELS[log.status]}
                              </span>
                              <span className="text-slate-600">작성자: {log.agentName}</span>
                              <span className="text-slate-400">
                                {new Date(log.createdAt).toLocaleString("ko-KR")}
                              </span>
                              {log.memo && (
                                <span className="text-slate-700">&ldquo;{log.memo}&rdquo;</span>
                              )}
                              {(role === "ADMIN" || log.agentId === currentUserId) && (
                                <button type="button" onClick={() => editMemo(log)} className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
                                  {role === "ADMIN" ? "기록 수정" : "메모 수정"}
                                </button>
                              )}
                              {role === "ADMIN" && (
                                <button type="button" onClick={() => deleteLog(log.id)} className="rounded border border-rose-300 px-2 py-0.5 text-xs text-rose-600">
                                  기록 삭제
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
