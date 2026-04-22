"use client";

import { useState, useEffect, useCallback } from "react";
import { X, UserPlus, Trash2, Crown, Loader2 } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: string;
  createdAt?: string;
}

interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
}

export function MembersModal({ open, onClose, accountId }: MembersModalProps) {
  const [owner, setOwner] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/members`);
      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
        setMembers(data.members);
        setIsOwner(data.isOwner);
      }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      setError("");
      setSuccess("");
      setEmail("");
    }
  }, [open, fetchMembers]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setAdding(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/accounts/${accountId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSuccess(`Added ${data.email}`);
        setEmail("");
        fetchMembers();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(memberId: string) {
    try {
      const res = await fetch(`/api/accounts/${accountId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch {
      // ignore
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Access</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Current members list */}
              <div className="space-y-2">
                {/* Owner */}
                {owner && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {owner.email}
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <Crown className="h-2.5 w-2.5" />
                          Owner
                        </span>
                      </div>
                      {owner.name && (
                        <p className="text-xs text-gray-500">{owner.name}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Members */}
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {member.email}
                        </span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          Viewer
                        </span>
                      </div>
                      {member.name && (
                        <p className="text-xs text-gray-500">{member.name}</p>
                      )}
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="ml-2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {members.length === 0 && (
                  <p className="py-2 text-center text-sm text-gray-400">
                    No team members yet
                  </p>
                )}
              </div>

              {/* Add member form (owner only) */}
              {isOwner && (
                <form onSubmit={handleAdd} className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Add a team member
                  </label>
                  <p className="mb-3 text-xs text-gray-400">
                    They&apos;ll be able to view the dashboard and export data.
                    They must have an Agent Analytics account first.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      placeholder="colleague@company.com"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={adding || !email.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                    >
                      {adding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      Add
                    </button>
                  </div>

                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                  {success && (
                    <p className="mt-2 text-sm text-brand-600">{success}</p>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
