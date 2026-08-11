"use client";

import { useState } from "react";
import { REGION_AREAS, REGIONS, type Province } from "@/lib/regions";

function templates(userName: string, province: Province, area: string) {
  const region = `${province} ${area.replace(/시$|군$|구$/, "")}`;
  return [
    `■ 운송장번호 :\n■ 차주 (이름/차량번호/연락처) :\n■ 내용 : 화물 등록 요청\n(${userName})`,
    `${region} 지역 미배차 화물 / 배차 OB\n운송장번호 :\n- 배차 성공`,
    `${region} 지역 미배차 화물 / 배차 OB\n- 매칭 실패`,
    `${region} 지역 미배차 화물 / 배차 OB\n- 부재`,
  ];
}

export default function TemplatePanel({ currentUserName, assignedRegions }: { currentUserName: string; assignedRegions: Province[] }) {
  const initialProvince = assignedRegions[0] ?? "경남";
  const [province, setProvince] = useState<Province>(initialProvince);
  const [area, setArea] = useState<string>(REGION_AREAS[initialProvince][0]);
  const [values, setValues] = useState(() => templates(currentUserName, initialProvince, REGION_AREAS[initialProvince][0]));
  const [copied, setCopied] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  function applyRegion(nextProvince: Province, nextArea: string) {
    setProvince(nextProvince);
    setArea(nextArea);
    const defaults = templates(currentUserName, nextProvince, nextArea);
    setValues((current) => current.map((value, index) => index === 0 ? value : `${defaults[index].split("\n")[0]}\n${value.split("\n").slice(1).join("\n")}`));
  }

  async function copy(index: number) {
    await navigator.clipboard.writeText(values[index]);
    setCopied(index);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const titles = ["이관 템플릿", "배차 상담 템플릿", "매칭 실패 템플릿", "부재 템플릿"];
  return (
    <section className={`sticky bottom-0 z-20 rounded-2xl border border-slate-300 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur ${open ? "p-5" : "p-3"}`}>
      <div className={`flex flex-wrap items-end justify-between gap-3 ${open ? "mb-4" : ""}`}>
        <div><h2 className="font-bold text-slate-900">상담 템플릿</h2>{open && <p className="text-xs text-slate-500">{assignedRegions.length ? "배정받은 광역지역에서 선택하면 템플릿 첫 줄에 자동 반영됩니다." : "관리자에게 배정받은 지역이 없습니다."}</p>}</div>
        <div className="flex items-end gap-2">
          {open && <>
          <label className="text-xs font-medium text-slate-600">광역지역<select value={province} disabled={assignedRegions.length === 0} onChange={(event) => { const next = event.target.value as Province; applyRegion(next, REGION_AREAS[next][0]); }} className="mt-1 block rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100">{(assignedRegions.length ? assignedRegions : REGIONS).map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-600">세부지역<select value={area} onChange={(event) => applyRegion(province, event.target.value)} className="mt-1 block rounded-md border border-slate-300 px-2 py-1.5 text-sm">{REGION_AREAS[province].map((name) => <option key={name}>{name}</option>)}</select></label>
          </>}
          <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{open ? "접기" : "펼치기"}</button>
        </div>
      </div>
      {open && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {values.map((value, index) => (
          <div key={titles[index]} className="rounded-xl border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-bold text-slate-800">{titles[index]}</h3>
            <textarea value={value} onChange={(event) => setValues((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="h-40 w-full resize-none rounded-lg border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-blue-500" />
            <div className="mt-2 flex gap-2"><button type="button" onClick={() => copy(index)} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">{copied === index ? "복사 완료" : "전체 복사"}</button><button type="button" onClick={() => setValues((current) => current.map((item, itemIndex) => itemIndex === index ? templates(currentUserName, province, area)[index] : item))} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600">초기화</button></div>
          </div>
        ))}
      </div>}
    </section>
  );
}
