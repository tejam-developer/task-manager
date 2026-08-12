import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = body.title?.trim();
  const listId = body.listId;

  if (!title || !listId) {
    return NextResponse.json({ error: "Title and listId are required" }, { status: 400 });
  }

  // Confirm the list's board belongs to this user
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: { board: true },
  });
  if (!list || list.board.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lastCard = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: "desc" },
  });
  const position = lastCard ? lastCard.position + 1 : 0;

  const card = await prisma.card.create({
    data: { title, listId, position },
  });

  return NextResponse.json(card, { status: 201 });
}