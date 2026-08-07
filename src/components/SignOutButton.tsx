"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md border border-slate-300 px-3 py-1 text-slate-600 transition hover:bg-slate-100"
    >
      로그아웃
    </button>
  );
}
