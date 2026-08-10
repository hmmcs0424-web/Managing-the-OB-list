"use client";

import { useEffect } from "react";

export default function StatsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Failed to load admin stats", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-bold text-slate-900">실적 데이터를 불러오지 못했습니다.</h1>
      <p className="mt-2 text-sm text-slate-600">
        데이터베이스 업데이트 상태를 확인한 뒤 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        다시 시도
      </button>
    </div>
  );
}
