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
  dispatchSuccess?: boolean;
  doNotCall?: boolean;
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

  const validEntries = entries.flatMap((entry) => {
    const name = entry.name?.trim();
    const phoneNormalized = entry.phoneNormalized
      ? normalizePhone(entry.phoneNormalized)
      : "";
    const status = entry.status ?? "PENDING";

    if (!name || phoneNormalized.length < 9 || !isCallStatus(status)) {
      return [];
    }

    const phoneDisplay = formatPhoneDisplay(entry.phoneRaw ?? phoneNormalized);
    const plate = entry.plate?.trim() || null;
    const doNotCall = entry.doNotCall === true;

    return [{ entry, name, phoneNormalized, phoneDisplay, plate, doNotCall, status }];
  });

  if (validEntries.length === 0) {
    return NextResponse.json({ error: "이름과 올바른 전화번호를 확인해 주세요." }, { status: 400 });
  }

  try {
    const driverIds = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const item of validEntries) {
        const driver = await tx.driver.upsert({
          where: { phoneNormalized: item.phoneNormalized },
          update: {
            name: item.name,
            plate: item.plate,
            phoneDisplay: item.phoneDisplay,
            doNotCall: item.doNotCall,
          },
          create: {
            name: item.name,
            plate: item.plate,
            phoneNormalized: item.phoneNormalized,
            phoneDisplay: item.phoneDisplay,
            doNotCall: item.doNotCall,
          },
        });
        await tx.callLog.create({
          data: {
            driverId: driver.id,
            agentId: session.user.id,
            memo: item.entry.memo?.trim() || null,
            status: item.status,
            dispatchSuccess: item.entry.dispatchSuccess === true,
          },
        });
        ids.push(driver.id);
      }
      return ids;
    });

    return NextResponse.json({ ok: true, count: driverIds.length, driverId: driverIds.at(-1) });
  } catch (error) {
    console.error("Failed to register entries", error);
    return NextResponse.json(
      { error: "등록 중 서버 오류가 발생했습니다. 관리자에게 데이터베이스 상태를 확인해 달라고 요청해 주세요." },
      { status: 500 }
    );
  }
}
