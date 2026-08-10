import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { REGIONS } from "@/lib/regions";

export async function PUT(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const region = typeof body?.region === "string" ? body.region : "";
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
  const agentId = typeof body?.agentId === "string" && body.agentId ? body.agentId : null;

  if (!REGIONS.includes(region as (typeof REGIONS)[number])) {
    return NextResponse.json({ error: "올바른 지역을 선택해 주세요." }, { status: 400 });
  }

  try {
    const assignment = await prisma.regionAssignment.upsert({
      where: { region },
      update: { detail: detail || null, agentId },
      create: { region, detail: detail || null, agentId },
      include: { agent: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Failed to save region assignment", error);
    return NextResponse.json({ error: "지역 분배 저장에 실패했습니다." }, { status: 500 });
  }
}
