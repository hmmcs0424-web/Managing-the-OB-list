import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (typeof body?.active === "boolean") {
    if (id === session.user.id && body.active === false) {
      return NextResponse.json(
        { error: "본인 계정은 비활성화할 수 없습니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { active: body.active },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  }

  const username = typeof body?.username === "string" ? body.username.trim() : undefined;
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const password = typeof body?.password === "string" ? body.password : undefined;
  const role = body?.role === "ADMIN" || body?.role === "AGENT" ? body.role : undefined;

  if (!username && !name && !password && !role) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (username === "") {
    return NextResponse.json({ error: "아이디를 입력해주세요." }, { status: 400 });
  }
  if (name === "") {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (password !== undefined && password.length < 8) {
    return NextResponse.json(
      { error: "비밀번호는 8자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  if (username) {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists && exists.id !== id) {
      return NextResponse.json({ error: "이미 존재하는 아이디입니다." }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(username ? { username } : {}),
      ...(name ? { name } : {}),
      ...(role ? { role } : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
