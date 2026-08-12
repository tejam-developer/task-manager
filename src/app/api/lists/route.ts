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
  const boardId = body.boardId;

  if (!title || !boardId) {
    return NextResponse.json({ error: "Title and boardId are required" }, { status: 400 });
  }

  // Confirm the board belongs to this user
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board || board.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Put the new list at the end
  const lastList = await prisma.list.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });
  const position = lastList ? lastList.position + 1 : 0;

  const list = await prisma.list.create({
    data: { title, boardId, position },
  });

  return NextResponse.json(list, { status: 201 });
}