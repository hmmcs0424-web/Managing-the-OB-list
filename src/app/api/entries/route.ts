import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatPhoneDisplay, normalizePhone } from "@/lib/phone";
import { isCallStatus } from "@/lib/status";

interface EntryInput {
  name?: string;
  plate?: string;
  phoneRaw?: string;
  phoneNormalized?: string;
  memo?: string;
  status?: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entries: EntryInput[] = Array.isArray(body?.entries) ? body.entries : [];

  if (entries.length === 0) {
    return NextResponse.json({ error: "등록할 항목이 없습니다." }, { status: 400 });
  }

  let count = 0;
  for (const entry of entries) {
    const name = entry.name?.trim();
    const phoneNormalized = entry.phoneNormalized
      ? normalizePhone(entry.phoneNormalized)
      : "";
    const status = entry.status ?? "PENDING";

    if (!name || phoneNormalized.length < 9 || !isCallStatus(status)) {
      continue;
    }

    const phoneDisplay = formatPhoneDisplay(entry.phoneRaw ?? phoneNormalized);
    const plate = entry.plate?.trim() || null;

    const driver = await prisma.driver.upsert({
      where: { phoneNormalized },
      update: { name, plate, phoneDisplay },
      create: { name, plate, phoneNormalized, phoneDisplay },
    });

    await prisma.callLog.create({
      data: {
        driverId: driver.id,
        agentId: session.user.id,
        memo: entry.memo?.trim() || null,
        status,
      },
    });

    count += 1;
  }

  return NextResponse.json({ ok: true, count });
}
