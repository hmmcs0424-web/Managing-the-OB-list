"use client";

import { useState } from "react";

const TRANSFER_TEMPLATE = `■ 운송장번호 : 
■ 차주 (이름/차량번호/연락처) : 
■ 내용 : 화물 등록 요청 
(정지영)`;

const CONSULTATION_TEMPLATE = `000 지역 미배차 화물 배차 OB 
운송장번호 : 
- 배차 완료 
- 부재
- 배차 거부`;

export default function TemplatePanel() {
  const [open, setOpen] = useState(false);
  const [transfer, setTransfer] = useState(TRANSFER_TEMPLATE);
  const [consultation, setConsultation] = useState(CONSULTATION_TEMPLATE);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(720px,calc(100vw-2rem))]">
      {open && (
        <div className="mb-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">상담 템플릿</h2>
              <p className="text-xs text-slate-500">내용을 입력한 뒤 그대로 복사할 수 있습니다.</p>
            </div>
            {copied && <span className="text-xs font-semibold text-emerald-600">{copied} 복사 완료</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TemplateEditor
              title="이관 템플릿"
              value={transfer}
              onChange={setTransfer}
              onCopy={() => copy("이관 템플릿", transfer)}
              onReset={() => setTransfer(TRANSFER_TEMPLATE)}
            />
            <TemplateEditor
              title="상담 내용 작성 템플릿"
              value={consultation}
              onChange={setConsultation}
              onCopy={() => copy("상담 템플릿", consultation)}
              onReset={() => setConsultation(CONSULTATION_TEMPLATE)}
            />
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-700"
        >
          {open ? "템플릿 닫기" : "상담 템플릿 열기"}
        </button>
      </div>
    </div>
  );
}

function TemplateEditor({
  title,
  value,
  onChange,
  onCopy,
  onReset,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onCopy: () => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-bold text-slate-800">{title}</h3>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-40 w-full resize-none rounded-lg border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-blue-500"
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onCopy} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          전체 복사
        </button>
        <button type="button" onClick={onReset} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
          템플릿 초기화
        </button>
      </div>
    </section>
  );
}
