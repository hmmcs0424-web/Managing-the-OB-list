import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { kstStartOfToday } from "@/lib/time";
import { isCallStatus } from "@/lib/status";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = session.user.role === "ADMIN";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const agentId = searchParams.get("agentId");
    const status = searchParams.get("status");
    const createdAt = isAdmin
      ? {
          gte: from ? new Date(`${from}T00:00:00+09:00`) : kstStartOfToday(),
          ...(to ? { lte: new Date(`${to}T23:59:59.999+09:00`) } : {}),
        }
      : { gte: kstStartOfToday() };

    const logs = await prisma.callLog.findMany({
      where: {
        agentId: isAdmin ? agentId || undefined : session.user.id,
        createdAt,
        status: isAdmin && status && isCallStatus(status) ? status : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { id: true, name: true } },
        driver: {
          select: { id: true, name: true, plate: true, phoneDisplay: true, doNotCall: true },
        },
      },
    });
    const agents = isAdmin
      ? await prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
      : [];

    return NextResponse.json({ logs, agents });
  } catch (error) {
    console.error("Failed to load today's activity", error);
    return NextResponse.json(
      { error: "오늘 처리 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
