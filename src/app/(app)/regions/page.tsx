import RegionGuide from "@/components/RegionGuide";

export default function RegionsPage() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-slate-900">지역 확인</h1><p className="mt-1 text-sm text-slate-500">광역 지역을 선택해 포함된 시·군·구를 순서대로 확인하세요.</p></div>
      <RegionGuide />
    </div>
  );
}
