import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatPhoneDisplay, normalizePhone } from "@/lib/phone";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      callLogs: {
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { id: true, name: true } } },
      },
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ driver });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phoneNormalized = normalizePhone(typeof body?.phone === "string" ? body.phone : "");
  if (!name || phoneNormalized.length < 9) {
    return NextResponse.json({ error: "이름과 전화번호를 확인해주세요." }, { status: 400 });
  }

  const driver = await prisma.driver.update({
    where: { id },
    data: {
      name,
      plate: typeof body?.plate === "string" ? body.plate.trim() || null : null,
      tonnage: typeof body?.tonnage === "string" ? body.tonnage.trim() || null : null,
      vehicleType: typeof body?.vehicleType === "string" ? body.vehicleType.trim() || null : null,
      phoneNormalized,
      phoneDisplay: formatPhoneDisplay(phoneNormalized),
      doNotCall: body?.doNotCall === true,
    },
  });
  return NextResponse.json({ driver });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.$transaction([
    prisma.callLog.deleteMany({ where: { driverId: id } }),
    prisma.driver.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
