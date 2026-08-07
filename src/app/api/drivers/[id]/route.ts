import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
        include: { agent: { select: { name: true } } },
      },
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ driver });
}
