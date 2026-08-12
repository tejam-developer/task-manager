import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const card = await prisma.card.findUnique({
    where: { id },
    include: { list: { include: { board: true } } },
  });

  if (!card || card.list.board.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.card.delete({ where: { id } });
  return NextResponse.json({ success: true });
}