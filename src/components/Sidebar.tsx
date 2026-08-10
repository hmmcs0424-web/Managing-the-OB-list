"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLink { href: string; label: string; download?: boolean }

const agentLinks: SidebarLink[] = [
  { href: "/", label: "상담메모" },
  { href: "/regions", label: "지역 확인" },
  { href: "/my-stats", label: "내 실적" },
];

const adminLinks: SidebarLink[] = [
  { href: "/", label: "상담메모" },
  { href: "/admin/stats", label: "대시보드" },
  { href: "/api/export", label: "Raw Data", download: true },
  { href: "/admin/users", label: "계정관리" },
  { href: "/admin/regions", label: "지역 분배" },
];

export default function Sidebar({ role }: { role: "AGENT" | "ADMIN" }) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? adminLinks : agentLinks;

  return (
    <aside className="border-b border-slate-200 bg-white md:min-h-[calc(100vh-57px)] md:w-52 md:flex-none md:border-b-0 md:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:p-4">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              download={link.download}
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium ${
                active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
