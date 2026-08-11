"use client";

import { useMemo, useState } from "react";
import { REGION_AREAS, REGIONS, type Province } from "@/lib/regions";

export default function RegionGuide() {
  const [province, setProvince] = useState<Province>("경남");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const areas = REGION_AREAS[province];
  const matches = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) return [];
    return REGIONS.flatMap((name) => REGION_AREAS[name].filter((area) => area.includes(keyword)).map((area) => ({ province: name, area })));
  }, [query]);

  function selectProvince(next: Province) {
    setProvince(next);
    setSelectedIndex(0);
    setQuery("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-semibold text-slate-700">지역명 검색
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 김해, 거창, 고성" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500" />
        </label>
        {query && <div className="mt-3 flex flex-wrap gap-2">{matches.length ? matches.map((match) => <button key={`${match.province}-${match.area}`} type="button" onClick={() => { selectProvince(match.province); setSelectedIndex(REGION_AREAS[match.province].indexOf(match.area as never)); }} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700">{match.province} · {match.area}</button>) : <span className="text-sm text-slate-400">검색 결과가 없습니다.</span>}</div>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="px-2 py-2 text-sm font-bold text-slate-800">광역 지역</h2>
          <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-2">{REGIONS.map((name) => <button key={name} type="button" onClick={() => selectProvince(name)} className={`rounded-lg px-2 py-2 text-sm ${province === name ? "bg-blue-600 font-semibold text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{name}</button>)}</div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
            <div><p className="text-sm text-slate-500">선택 지역</p><h2 className="text-2xl font-bold text-slate-900">{province} <span className="text-base font-medium text-slate-400">{areas.length}개 시·군·구</span></h2></div>
            <div className="flex gap-2"><button type="button" disabled={selectedIndex === 0} onClick={() => setSelectedIndex((index) => index - 1)} className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">이전</button><button type="button" disabled={selectedIndex === areas.length - 1} onClick={() => setSelectedIndex((index) => index + 1)} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-40">다음 지역</button></div>
          </div>
          <div className="my-5 rounded-xl bg-blue-50 p-4"><span className="text-sm text-blue-600">현재 순서 {selectedIndex + 1}/{areas.length}</span><div className="mt-1 text-2xl font-bold text-blue-900">{areas[selectedIndex]}</div></div>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">{areas.map((area, index) => <button key={area} type="button" onClick={() => setSelectedIndex(index)} className={`rounded-lg border px-3 py-3 text-left text-sm ${selectedIndex === index ? "border-blue-500 bg-blue-50 font-bold text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}><span className="mr-2 text-xs text-slate-400">{index + 1}</span>{area}</button>)}</div>
        </section>
      </div>
    </div>
  );
}
