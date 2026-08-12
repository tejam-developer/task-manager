import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { listId, position } = body;

  if (!listId || position === undefined) {
    return NextResponse.json({ error: "listId and position required" }, { status: 400 });
  }

  // Confirm the card belongs to this user (via its current list/board)
  const card = await prisma.card.findUnique({
    where: { id },
    include: { list: { include: { board: true } } },
  });
  if (!card || card.list.board.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Confirm the target list also belongs to this user
  const targetList = await prisma.list.findUnique({
    where: { id: listId },
    include: { board: true },
  });
  if (!targetList || targetList.board.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.card.update({
    where: { id },
    data: { listId, position },
  });

  return NextResponse.json(updated);
}