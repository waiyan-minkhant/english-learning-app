"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Text } from "@/components/ui";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { MediaPrepPanel } from "@/features/media/components/MediaPrepPanel";
import { useMediaPreferencesStore } from "@/features/media/store/mediaPreferencesStore";
import {
  useJoinSession,
  useStartSession
} from "@/features/session/hooks/useSession";
import type { SessionUser } from "@/features/auth/lib/auth";

export default function DashboardPage() {
  return (
    <RequireAuth fallback={<main className="p-6">Loading...</main>}>
      {(user) => <DashboardContent user={user} />}
    </RequireAuth>
  );
}

function DashboardContent({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { logout } = useAuth();
  const startSession = useStartSession();
  const joinSession = useJoinSession();
  const [error, setError] = useState<string | null>(null);
  const permission = useMediaPreferencesStore((state) => state.permission);

  const actionLoading = startSession.isPending || joinSession.isPending;
  const mediaReady = permission === "granted";
  const actionsDisabled = actionLoading || !mediaReady;
  const isTeacher = user.role === "teacher";

  useEffect(() => {
    if (logout.isSuccess) {
      router.replace("/login");
    }
  }, [logout.isSuccess, router]);

  async function handleLogout() {
    setError(null);
    try {
      await logout.mutateAsync();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : "Logout failed"
      );
    }
  }

  async function handleStartClass() {
    setError(null);
    try {
      await startSession.mutateAsync();
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Failed to start class"
      );
    }
  }

  async function handleJoinClass() {
    setError(null);
    try {
      await joinSession.mutateAsync();
    } catch (joinError) {
      setError(
        joinError instanceof Error ? joinError.message : "Failed to join class"
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <Text variant="heading" size="title-32" as="h1">
          Dashboard
        </Text>
        <Text variant="body">
          Logged in as {user.email} ({user.role})
        </Text>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <Text variant="title" as="h2">
            {isTeacher ? "Start a live class" : "Join your class"}
          </Text>
          <Text variant="body">
            {isTeacher
              ? "Start class to open a live session. Your student can join once the session is live."
              : "Join class when your teacher has started the session."}
          </Text>

          <MediaPrepPanel userName={user.name} />

          {isTeacher ? (
            <Button
              type="button"
              onClick={handleStartClass}
              disabled={actionsDisabled}
            >
              {startSession.isPending ? "Starting..." : "Start class"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleJoinClass}
              disabled={actionsDisabled}
            >
              {joinSession.isPending ? "Joining..." : "Join class"}
            </Button>
          )}
        </CardContent>
      </Card>

      {error ? (
        <Text variant="body" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button variant="secondary" onClick={handleLogout} disabled={logout.isPending}>
        Logout
      </Button>
    </main>
  );
}
