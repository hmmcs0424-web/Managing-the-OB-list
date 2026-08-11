import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REGIONS, type Province } from "@/lib/regions";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = (await request.json()) as { region?: string; agentId?: string | null };
    if (!body.region || !REGIONS.includes(body.region as Province)) {
      return NextResponse.json({ error: "올바른 광역지역을 선택해 주세요." }, { status: 400 });
    }

    const agentId = body.agentId || null;
    if (agentId) {
      const agent = await prisma.user.findFirst({
        where: { id: agentId, role: "AGENT", active: true },
        select: { id: true },
      });
      if (!agent) {
        return NextResponse.json({ error: "활성 상담사 계정을 찾을 수 없습니다." }, { status: 400 });
      }
    }

    const assignment = await prisma.regionAssignment.upsert({
      where: { region: body.region },
      update: { agentId },
      create: { region: body.region, agentId },
      select: { region: true, agentId: true },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Failed to update region assignment", error);
    return NextResponse.json({ error: "지역 배정 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
