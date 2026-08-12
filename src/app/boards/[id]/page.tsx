"use client";

import { useEffect, useState, use } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

type Card = {
  id: string;
  title: string;
  position: number;
  dueDate: string | null;
};

type List = {
  id: string;
  title: string;
  position: number;
  cards: Card[];
};

type Board = {
  id: string;
  title: string;
  lists: List[];
};

function SortableCard({ card, onDelete }: { card: Card; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        background: "white",
        padding: 8,
        marginBottom: 8,
        borderRadius: 4,
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{card.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          ✕
        </button>
      </div>
      {card.dueDate && (
        <div style={{ fontSize: 12, color: isOverdue ? "red" : "#666", marginTop: 4 }}>
          Due: {new Date(card.dueDate).toLocaleDateString()}
        </div>
      )}
    </li>
  );
}

function DroppableList({
  list,
  children,
  onDeleteList,
  newCardTitle,
  onCardTitleChange,
  newCardDueDate,
  onCardDueDateChange,
  onCreateCard,
 }: {
  list: List;
  children: React.ReactNode;
  onDeleteList: (id: string) => void;
  newCardTitle: string;
  onCardTitleChange: (v: string) => void;
  newCardDueDate: string;
  onCardDueDateChange: (v: string) => void;
  onCreateCard: () => void;
 }) {
  const { setNodeRef } = useDroppable({ id: list.id });

  return (
    <div
      ref={setNodeRef}
      style={{ minWidth: 250, background: "#f4f4f4", padding: 12, borderRadius: 8 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{list.title}</strong>
        <button onClick={() => onDeleteList(list.id)}>✕</button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", minHeight: 20 }}>
        {children}
      </ul>

     <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <input
            type="text"
            value={newCardTitle}
            onChange={(e) => onCardTitleChange(e.target.value)}
            placeholder="New card"
            style={{ padding: 6 }}
        />
        <div style={{ display: "flex", gap: 4 }}>
            <input
            type="date"
            value={newCardDueDate}
            onChange={(e) => onCardDueDateChange(e.target.value)}
            style={{ flex: 1, padding: 6 }}
            />
            <button onClick={onCreateCard}>+</button>
        </div>
      </div>
    </div>
  );
}

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [newCardDueDates, setNewCardDueDates] = useState<Record<string, string>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function loadBoard() {
    setLoading(true);
    const res = await fetch(`/api/boards/${id}`);
    if (res.ok) {
      setBoard(await res.json());
    } else {
      setError("Failed to load board");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBoard();
  }, [id]);

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newListTitle, boardId: id }),
    });
    if (res.ok) {
      setNewListTitle("");
      loadBoard();
    } else {
      setError("Failed to create list");
    }
  }

  async function handleDeleteList(listId: string) {
    if (!confirm("Delete this list and all its cards?")) return;
    const res = await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    if (res.ok) loadBoard();
    else setError("Failed to delete list");
  }

    async function handleCreateCard(listId: string) {
    const title = newCardTitles[listId]?.trim();
    if (!title) return;
    const dueDate = newCardDueDates[listId] || null;

    const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, listId, dueDate }),
    });

    if (res.ok) {
        setNewCardTitles((prev) => ({ ...prev, [listId]: "" }));
        setNewCardDueDates((prev) => ({ ...prev, [listId]: "" }));
        loadBoard();
    } else {
        setError("Failed to create card");
    }
    }

  async function handleDeleteCard(cardId: string) {
    const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    if (res.ok) loadBoard();
    else setError("Failed to delete card");
  }

  function findCard(cardId: string): { card: Card; list: List } | null {
    if (!board) return null;
    for (const list of board.lists) {
      const card = list.cards.find((c) => c.id === cardId);
      if (card) return { card, list };
    }
    return null;
  }

  function findList(overId: string): List | null {
    if (!board) return null;
    // overId might be a list id (empty list) or a card id (dropped on a card)
    const byList = board.lists.find((l) => l.id === overId);
    if (byList) return byList;
    const found = findCard(overId);
    return found ? found.list : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const found = findCard(event.active.id as string);
    if (found) setActiveCard(found.card);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const source = findCard(activeId);
    const destList = findList(overId);
    if (!source || !destList) return;

    const sourceList = source.list;
    const isSameList = sourceList.id === destList.id;

    // Build the destination card array (excluding the moving card)
    const destCards = destList.cards.filter((c) => c.id !== activeId);
    const overCard = destCards.find((c) => c.id === overId);
    const overIndex = overCard ? destCards.indexOf(overCard) : destCards.length;

    // Compute new position: halfway between neighbors
    const prev = destCards[overIndex - 1];
    const next = destCards[overIndex];
    let newPosition: number;
    if (!prev && !next) newPosition = 0;
    else if (!prev) newPosition = next.position - 1;
    else if (!next) newPosition = prev.position + 1;
    else newPosition = (prev.position + next.position) / 2;

    // Optimistic UI update
    setBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;
      const newLists = prevBoard.lists.map((l) => {
        if (l.id === sourceList.id && !isSameList) {
          return { ...l, cards: l.cards.filter((c) => c.id !== activeId) };
        }
        if (l.id === destList.id) {
          const updatedCard = { ...source.card, position: newPosition, listId: destList.id };
          const withoutMoving = l.cards.filter((c) => c.id !== activeId);
          const insertAt = overCard ? withoutMoving.findIndex((c) => c.id === overId) : withoutMoving.length;
          const newCards = [...withoutMoving];
          newCards.splice(insertAt, 0, updatedCard);
          return { ...l, cards: newCards };
        }
        return l;
      });
      return { ...prevBoard, lists: newLists };
    });

    // Persist to server
    const res = await fetch(`/api/cards/${activeId}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: destList.id, position: newPosition }),
    });

    if (!res.ok) {
      setError("Failed to save card position");
      loadBoard(); // re-sync with server on failure
    }
  }

  if (loading) return <p style={{ padding: 16 }}>Loading...</p>;
  if (!board) return <p style={{ padding: 16 }}>Board not found.</p>;

  return (
    <div style={{ padding: 16 }}>
      <a href="/boards">← Back to My Boards</a>
      <h1>{board.title}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleCreateList} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
          placeholder="New list title"
          style={{ padding: 8 }}
        />
        <button type="submit">Add List</button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
          {board.lists.map((list) => (
          <DroppableList
                key={list.id}
                list={list}
                onDeleteList={handleDeleteList}
                newCardTitle={newCardTitles[list.id] || ""}
                onCardTitleChange={(v) => setNewCardTitles((prev) => ({ ...prev, [list.id]: v }))}
                newCardDueDate={newCardDueDates[list.id] || ""}
                onCardDueDateChange={(v) => setNewCardDueDates((prev) => ({ ...prev, [list.id]: v }))}
                onCreateCard={() => handleCreateCard(list.id)}
            >
              <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {list.cards.map((card) => (
                  <SortableCard key={card.id} card={card} onDelete={handleDeleteCard} />
                ))}
              </SortableContext>
            </DroppableList>
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <li
              style={{
                background: "white",
                padding: 8,
                borderRadius: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                listStyle: "none",
              }}
            >
              {activeCard.title}
            </li>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}