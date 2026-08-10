"use client";

import { useState } from "react";

interface UserRow {
  id: string;
  username: string;
  name: string;
  role: "AGENT" | "ADMIN";
  active: boolean;
  createdAt: string;
}

export default function UserManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"AGENT" | "ADMIN">("AGENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"AGENT" | "ADMIN">("AGENT");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "생성에 실패했습니다.");
      return;
    }
    setUsers((prev) => [...prev, data.user]);
    setName("");
    setUsername("");
    setPassword("");
    setRole("AGENT");
  }

  async function toggleActive(user: UserRow) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "변경에 실패했습니다.");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? data.user : u)));
  }

  function startEdit(user: UserRow) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPassword("");
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditError(null);
    setEditSaving(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        username: editUsername,
        role: editRole,
        ...(editPassword ? { password: editPassword } : {}),
      }),
    });
    const data = await res.json();
    setEditSaving(false);
    if (!res.ok) {
      setEditError(data.error ?? "수정에 실패했습니다.");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">이름</label>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">아이디</label>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            비밀번호 (8자 이상)
          </label>
          <input
            type="password"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">권한</label>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as "AGENT" | "ADMIN")}
          >
            <option value="AGENT">상담사</option>
            <option value="ADMIN">관리자</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "계정 생성"}
        </button>
        {error && <p className="w-full text-sm text-rose-600">{error}</p>}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2">이름</th>
              <th className="py-2">아이디</th>
              <th className="py-2">권한</th>
              <th className="py-2">상태</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) =>
              editingId === u.id ? (
                <tr key={u.id} className="border-b border-slate-100 bg-slate-50">
                  <td colSpan={5} className="py-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          이름
                        </label>
                        <input
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          아이디
                        </label>
                        <input
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          권한
                        </label>
                        <select
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as "AGENT" | "ADMIN")}
                        >
                          <option value="AGENT">상담사</option>
                          <option value="ADMIN">관리자</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          새 비밀번호 (선택, 8자 이상)
                        </label>
                        <input
                          type="password"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="변경 시에만 입력"
                          minLength={8}
                        />
                      </div>
                      <button
                        onClick={() => saveEdit(u.id)}
                        disabled={editSaving}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {editSaving ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        취소
                      </button>
                      {editError && <p className="w-full text-sm text-rose-600">{editError}</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-900">{u.name}</td>
                  <td className="py-2 text-slate-600">{u.username}</td>
                  <td className="py-2 text-slate-600">
                    {u.role === "ADMIN" ? "관리자" : "상담사"}
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => startEdit(u)}
                      className="mr-2 rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      {u.active ? "비활성화" : "활성화"}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
