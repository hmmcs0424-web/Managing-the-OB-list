import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parsePasteText } from "@/lib/parse";
import { formatPhoneDisplay } from "@/lib/phone";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";
  const rows = parsePasteText(text);

  const validPhones = Array.from(
    new Set(rows.filter((r) => !r.error && r.phoneNormalized).map((r) => r.phoneNormalized!))
  );

  const existingDrivers = validPhones.length
    ? await prisma.driver.findMany({
        where: { phoneNormalized: { in: validPhones } },
        include: {
          callLogs: {
            orderBy: { createdAt: "desc" },
            include: { agent: { select: { name: true } } },
          },
        },
      })
    : [];

  const byPhone = new Map(existingDrivers.map((d) => [d.phoneNormalized, d]));

  const results = rows.map((row) => {
    if (row.error) {
      return { ...row, kind: "error" as const };
    }

    const existing = byPhone.get(row.phoneNormalized!);
    if (!existing) {
      return {
        ...row,
        phoneDisplay: formatPhoneDisplay(row.phoneRaw!),
        kind: "new" as const,
      };
    }

    return {
      ...row,
      phoneDisplay: existing.phoneDisplay,
      kind: "duplicate" as const,
      driverId: existing.id,
      existing: {
        name: existing.name,
        plate: existing.plate,
        doNotCall: existing.doNotCall,
        callCount: existing.callLogs.length,
        history: existing.callLogs.map((log) => ({
          id: log.id,
          status: log.status,
          memo: log.memo,
          dispatchSuccess: log.dispatchSuccess,
          agentName: log.agent.name,
          createdAt: log.createdAt,
        })),
      },
    };
  });

  return NextResponse.json({ results });
}
