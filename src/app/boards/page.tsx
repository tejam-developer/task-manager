"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type Board = {
  id: string;
  title: string;
  createdAt: string;
};

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBoards() {
    setLoading(true);
    const res = await fetch("/api/boards");
    if (res.ok) {
      setBoards(await res.json());
    } else {
      setError("Failed to load boards");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBoards();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });

    if (res.ok) {
      setNewTitle("");
      loadBoards();
    } else {
      setError("Failed to create board");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this board?")) return;

    const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadBoards();
    } else {
      setError("Failed to delete board");
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Boards</h1>
        <button onClick={() => signOut({ callbackUrl: "/login" })}>Log out</button>
      </div>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New board title"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Create</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : boards.length === 0 ? (
        <p>No boards yet. Create one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {boards.map((board) => (
            <li
              key={board.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
            <a href={`/boards/${board.id}`} style={{ textDecoration: "underline", cursor: "pointer" }}>
               {board.title}
            </a>
              <button onClick={() => handleDelete(board.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}