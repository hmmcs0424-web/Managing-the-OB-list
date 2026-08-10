import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTodayStats } from "@/lib/stats";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const stats = await getTodayStats();
  return NextResponse.json(stats);
}
