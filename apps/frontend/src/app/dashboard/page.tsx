"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/require-auth";
import {
  joinSessionRequest,
  logoutRequest,
  startSessionRequest
} from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import { useState } from "react";

export default function DashboardPage() {
  return (
    <RequireAuth fallback={<main className="p-6">Loading...</main>}>
      {(user) => <DashboardContent user={user} />}
    </RequireAuth>
  );
}

function DashboardContent({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    try {
      await logoutRequest();
      router.replace("/login");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : "Logout failed"
      );
    }
  }

  async function handleStartClass() {
    setError(null);
    setActionLoading(true);
    try {
      const { roomId } = await startSessionRequest();
      router.push(`/call/${encodeURIComponent(roomId)}`);
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Failed to start class"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoinClass() {
    setError(null);
    setActionLoading(true);
    try {
      const session = await joinSessionRequest();
      router.push(`/call/${encodeURIComponent(session.roomId)}`);
    } catch (joinError) {
      setError(
        joinError instanceof Error ? joinError.message : "Failed to join class"
      );
    } finally {
      setActionLoading(false);
    }
  }

  const isTeacher = user.role === "teacher";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600">
          Logged in as {user.email} ({user.role})
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          {isTeacher ? "Start a live class" : "Join your class"}
        </h2>
        <p className="text-sm text-slate-600">
          {isTeacher
            ? "Start class to open a live session. Your student can join once the session is live."
            : "Join class when your teacher has started the session."}
        </p>
        {isTeacher ? (
          <Button
            type="button"
            onClick={handleStartClass}
            disabled={actionLoading}
          >
            {actionLoading ? "Starting..." : "Start class"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleJoinClass}
            disabled={actionLoading}
          >
            {actionLoading ? "Joining..." : "Join class"}
          </Button>
        )}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </main>
  );
}
