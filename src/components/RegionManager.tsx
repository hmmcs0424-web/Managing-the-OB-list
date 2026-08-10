"use client";

import { useState } from "react";
import { REGIONS } from "@/lib/regions";

interface Agent { id: string; name: string }
interface Assignment { region: string; detail: string | null; agentId: string | null; agent: Agent | null }

export default function RegionManager({ agents, initial }: { agents: Agent[]; initial: Assignment[] }) {
  const initialMap = new Map(initial.map((item) => [item.region, item]));
  const [rows, setRows] = useState(() =>
    REGIONS.map((region) => ({
      region,
      agentId: initialMap.get(region)?.agentId ?? "",
      detail: initialMap.get(region)?.detail ?? "",
      saved: false,
    }))
  );

  function update(region: string, field: "agentId" | "detail", value: string) {
    setRows((current) => current.map((row) => row.region === region ? { ...row, [field]: value, saved: false } : row));
  }

  async function save(region: string) {
    const row = rows.find((item) => item.region === region)!;
    const response = await fetch("/api/admin/regions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return window.alert(data?.error ?? "저장에 실패했습니다.");
    setRows((current) => current.map((item) => item.region === region ? { ...item, saved: true } : item));
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr><th className="px-4 py-3">지역</th><th className="px-4 py-3">담당 상담사</th><th className="px-4 py-3">세부 지역정보</th><th className="px-4 py-3">저장</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.region}>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.region}</td>
              <td className="px-4 py-3">
                <select value={row.agentId} onChange={(event) => update(row.region, "agentId", event.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-2">
                  <option value="">미배정</option>
                  {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                </select>
              </td>
              <td className="px-4 py-3">
                <input value={row.detail} onChange={(event) => update(row.region, "detail", event.target.value)} placeholder="시·군·구, 참고사항 등을 입력" className="w-full rounded-md border border-slate-300 px-3 py-2" />
              </td>
              <td className="px-4 py-3">
                <button type="button" onClick={() => save(row.region)} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">{row.saved ? "저장됨" : "저장"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
