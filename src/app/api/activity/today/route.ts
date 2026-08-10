import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { kstStartOfToday } from "@/lib/time";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const logs = await prisma.callLog.findMany({
    where: {
      agentId: session.user.id,
      createdAt: { gte: kstStartOfToday() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      agent: { select: { id: true, name: true } },
      driver: {
        select: { id: true, name: true, plate: true, phoneDisplay: true, doNotCall: true },
      },
    },
  });

  return NextResponse.json({ logs });
}
