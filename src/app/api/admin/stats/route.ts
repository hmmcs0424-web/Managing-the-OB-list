import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPerformanceStats } from "@/lib/stats";
import { currentKstMonthRange } from "@/lib/time";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = currentKstMonthRange();
  const from = searchParams.get("from") ?? month.from;
  const to = searchParams.get("to") ?? month.to;
  const stats = await getPerformanceStats(from, to);
  return NextResponse.json(stats);
}
