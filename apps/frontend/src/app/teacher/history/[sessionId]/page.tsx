"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { TeacherHistorySessionDetail } from "@/features/history/components/TeacherHistorySessionDetail";
import type { SessionUser } from "@/features/auth/lib/auth";
import { Text } from "@/components/ui";

export default function TeacherHistorySessionPage() {
  return (
    <RequireAuth fallback={<main className="p-6">Loading...</main>}>
      {(user) => <TeacherHistorySessionGate user={user} />}
    </RequireAuth>
  );
}

function TeacherHistorySessionGate({ user }: { user: SessionUser }) {
  const router = useRouter();

  useEffect(() => {
    if (user.role !== "teacher") {
      router.replace("/dashboard");
    }
  }, [user.role, router]);

  if (user.role !== "teacher") {
    return <main className="p-6">Redirecting…</main>;
  }

  return (
    <Suspense
      fallback={
        <main className="p-6">
          <Text variant="body">Loading…</Text>
        </main>
      }
    >
      <TeacherHistorySessionDetail />
    </Suspense>
  );
}
