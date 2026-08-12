"use client";

import { useEffect, useState, use } from "react";

type Card = {
  id: string;
  title: string;
  position: number;
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

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});

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
    if (res.ok) {
      loadBoard();
    } else {
      setError("Failed to delete list");
    }
  }

  async function handleCreateCard(listId: string) {
    const title = newCardTitles[listId]?.trim();
    if (!title) return;

    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, listId }),
    });

    if (res.ok) {
      setNewCardTitles((prev) => ({ ...prev, [listId]: "" }));
      loadBoard();
    } else {
      setError("Failed to create card");
    }
  }

  async function handleDeleteCard(cardId: string) {
    const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    if (res.ok) {
      loadBoard();
    } else {
      setError("Failed to delete card");
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

      <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
        {board.lists.map((list) => (
          <div
            key={list.id}
            style={{
              minWidth: 250,
              background: "#f4f4f4",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{list.title}</strong>
              <button onClick={() => handleDeleteList(list.id)}>✕</button>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>
              {list.cards.map((card) => (
                <li
                  key={card.id}
                  style={{
                    background: "white",
                    padding: 8,
                    marginBottom: 8,
                    borderRadius: 4,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{card.title}</span>
                  <button onClick={() => handleDeleteCard(card.id)}>✕</button>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="text"
                value={newCardTitles[list.id] || ""}
                onChange={(e) =>
                  setNewCardTitles((prev) => ({ ...prev, [list.id]: e.target.value }))
                }
                placeholder="New card"
                style={{ flex: 1, padding: 6 }}
              />
              <button onClick={() => handleCreateCard(list.id)}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}