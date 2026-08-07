import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { isCallStatus } from "@/lib/status";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const digitsQuery = normalizePhone(q);

  const drivers = await prisma.driver.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { plate: { contains: q, mode: "insensitive" } },
            ...(digitsQuery ? [{ phoneNormalized: { contains: digitsQuery } }] : []),
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 300,
    include: {
      callLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { agent: { select: { name: true } } },
      },
      _count: { select: { callLogs: true } },
    },
  });

  const mapped = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    plate: d.plate,
    phoneDisplay: d.phoneDisplay,
    updatedAt: d.updatedAt,
    callCount: d._count.callLogs,
    latest: d.callLogs[0]
      ? {
          status: d.callLogs[0].status,
          memo: d.callLogs[0].memo,
          agentName: d.callLogs[0].agent.name,
          createdAt: d.callLogs[0].createdAt,
        }
      : null,
  }));

  const filtered =
    statusFilter && isCallStatus(statusFilter)
      ? mapped.filter((d) => d.latest?.status === statusFilter)
      : mapped;

  return NextResponse.json({ drivers: filtered });
}
