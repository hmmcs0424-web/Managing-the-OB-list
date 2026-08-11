import Link from "next/link";
import { auth } from "@/auth";
import SignOutButton from "./SignOutButton";

export default async function AppHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-bold text-slate-900">
          미배차 OB 차주 관리
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {user && (
            <span className="text-slate-400">
              {user.name}
              {user.role === "ADMIN" ? " (관리자)" : ""}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
