"use client";

import { useState } from "react";
import { REGIONS, type Province } from "@/lib/regions";

interface Agent {
  id: string;
  name: string;
  username: string;
}

interface Assignment {
  region: string;
  agentId: string | null;
}

export default function RegionAssignmentManager({
  agents,
  initialAssignments,
}: {
  agents: Agent[];
  initialAssignments: Assignment[];
}) {
  const initialMap = Object.fromEntries(
    initialAssignments.map((assignment) => [assignment.region, assignment.agentId ?? ""]),
  ) as Record<Province, string>;
  const [assignments, setAssignments] = useState<Record<Province, string>>(initialMap);
  const [savingRegion, setSavingRegion] = useState<Province | null>(null);
  const [message, setMessage] = useState<{ region: Province; error?: string } | null>(null);

  async function save(region: Province) {
    setSavingRegion(region);
    setMessage(null);
    const response = await fetch("/api/admin/regions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region, agentId: assignments[region] || null }),
    });
    const data = await response.json();
    setSavingRegion(null);
    setMessage(
      response.ok
        ? { region }
        : { region, error: data.error ?? "지역 배정을 저장하지 못했습니다." },
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">지역 배정</h1>
        <p className="mt-1 text-sm text-slate-500">
          광역지역별 담당 상담사를 지정하면 상담사의 상담 템플릿에 해당 지역만 표시됩니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {REGIONS.map((region) => (
          <div key={region} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-bold text-slate-900">{region}</label>
            <div className="flex gap-2">
              <select
                value={assignments[region] ?? ""}
                onChange={(event) => {
                  setAssignments((current) => ({ ...current, [region]: event.target.value }));
                  setMessage(null);
                }}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">미배정</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.username})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={savingRegion === region}
                onClick={() => save(region)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingRegion === region ? "저장 중" : "저장"}
              </button>
            </div>
            {message?.region === region && (
              <p className={`mt-2 text-xs ${message.error ? "text-rose-600" : "text-emerald-600"}`}>
                {message.error ?? "저장되었습니다."}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
