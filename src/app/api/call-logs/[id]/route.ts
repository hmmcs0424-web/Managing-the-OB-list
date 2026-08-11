import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isCallStatus } from "@/lib/status";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const log = await prisma.callLog.findUnique({ where: { id }, select: { agentId: true } });
  if (!log) return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && log.agentId !== session.user.id) {
    return NextResponse.json({ error: "본인이 작성한 메모만 수정할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const data: { memo?: string | null; status?: "ACCEPTED" | "REJECTED" | "NO_ANSWER" | "PENDING"; dispatchSuccess?: boolean } = {};
  if (typeof body?.memo === "string") data.memo = body.memo.trim() || null;
  if (isAdmin && typeof body?.status === "string" && isCallStatus(body.status)) {
    data.status = body.status;
    data.dispatchSuccess = body.status === "ACCEPTED";
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
  }

  const updated = await prisma.callLog.update({ where: { id }, data });
  return NextResponse.json({ log: updated });
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
  await prisma.callLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
