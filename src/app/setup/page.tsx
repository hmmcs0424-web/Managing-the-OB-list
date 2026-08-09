import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SetupForm from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const count = await prisma.user.count();
  if (count > 0) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-lg font-bold text-slate-900">최초 관리자 계정 생성</h1>
        <p className="mb-6 text-sm text-slate-500">
          아직 계정이 없습니다. 최초 1회, 관리자 계정을 생성해 주세요. 이후에는 이 화면에
          접근할 수 없습니다.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
