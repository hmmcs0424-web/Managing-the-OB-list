"use client";

import { useState } from "react";
import { STATUS_LABELS, CALL_STATUSES, type CallStatus } from "@/lib/status";

interface ExistingInfo {
  name: string;
  plate: string | null;
  callCount: number;
  lastAgent: string | null;
  lastStatus: CallStatus | null;
  lastMemo: string | null;
  lastAt: string | null;
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
  existing?: ExistingInfo;
}

interface Row extends CheckResult {
  include: boolean;
  status: CallStatus;
  memo: string;
}

export default function EntryChecker({ onRegistered }: { onRegistered: () => void }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCheck() {
    setChecking(true);
    setMessage(null);
    const res = await fetch("/api/entries/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data: { results: CheckResult[] } = await res.json();
    setChecking(false);
    setRows(
      data.results.map((r) => ({
        ...r,
        include: r.kind !== "error",
        status: "PENDING",
        memo: "",
      }))
    );
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function handleRegister() {
    const toSubmit = rows.filter((r) => r.include && r.kind !== "error");
    if (toSubmit.length === 0) return;
    setSubmitting(true);
    setMessage(null);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: toSubmit.map((r) => ({
          name: r.name,
          plate: r.plate,
          phoneRaw: r.phoneRaw,
          phoneNormalized: r.phoneNormalized,
          memo: r.memo,
          status: r.status,
        })),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setMessage(data.error ?? "등록에 실패했습니다.");
      return;
    }
    setMessage(`${data.count}건 등록 완료`);
    setRows([]);
    setText("");
    onRegistered();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-base font-bold text-slate-900">차주 정보 붙여넣기</h2>
      <p className="mb-3 text-sm text-slate-500">
        한 줄에 하나씩, <span className="font-medium">이름, 차량번호, 전화번호</span> 형식으로
        붙여넣으세요. 여러 줄 한 번에 가능합니다.
      </p>
      <textarea
        className="mb-3 h-28 w-full rounded-lg border border-slate-300 p-3 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder={"정지영, 제주00아0000, 01012345678"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={handleCheck}
        disabled={checking || !text.trim()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {checking ? "확인 중..." : "중복 확인"}
      </button>

      {rows.length > 0 && (
        <div className="mt-5 space-y-3">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3 text-sm ${
                row.kind === "error"
                  ? "border-rose-200 bg-rose-50"
                  : row.kind === "duplicate"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={row.include}
                  disabled={row.kind === "error"}
                  onChange={(e) => updateRow(idx, { include: e.target.checked })}
                />
                <div>
                  <div className="font-medium text-slate-900">
                    {row.name ?? row.raw}
                    {row.plate ? ` · ${row.plate}` : ""}
                    {row.phoneDisplay ? ` · ${row.phoneDisplay}` : ""}
                  </div>
                  {row.kind === "error" && <div className="text-rose-600">{row.error}</div>}
                  {row.kind === "new" && <div className="text-emerald-600">신규 차주</div>}
                  {row.kind === "duplicate" && row.existing && (
                    <div className="mt-1 text-amber-700">
                      ⚠ 기존 이력 있음 (총 {row.existing.callCount}회) — 마지막:{" "}
                      {row.existing.lastAgent ?? "-"} 담당,{" "}
                      {row.existing.lastStatus ? STATUS_LABELS[row.existing.lastStatus] : "-"}
                      {row.existing.lastMemo ? ` · "${row.existing.lastMemo}"` : ""}
                      {row.existing.lastAt
                        ? ` · ${new Date(row.existing.lastAt).toLocaleString("ko-KR")}`
                        : ""}
                    </div>
                  )}
                </div>
              </label>

              {row.kind !== "error" && (
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={row.status}
                    onChange={(e) => updateRow(idx, { status: e.target.value as CallStatus })}
                  >
                    {CALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <input
                    className="min-w-[160px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    placeholder="메모 (선택)"
                    value={row.memo}
                    onChange={(e) => updateRow(idx, { memo: e.target.value })}
                  />
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleRegister}
            disabled={submitting || !rows.some((r) => r.include)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting
              ? "등록 중..."
              : `선택 항목 등록 (${rows.filter((r) => r.include).length}건)`}
          </button>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
