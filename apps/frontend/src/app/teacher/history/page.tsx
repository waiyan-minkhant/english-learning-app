"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { TeacherHistoryView } from "@/features/history/components/TeacherHistoryView";
import type { SessionUser } from "@/features/auth/lib/auth";

export default function TeacherHistoryPage() {
  return (
    <RequireAuth fallback={<main className="p-6">Loading...</main>}>
      {(user) => <TeacherHistoryGate user={user} />}
    </RequireAuth>
  );
}

function TeacherHistoryGate({ user }: { user: SessionUser }) {
  const router = useRouter();

  useEffect(() => {
    if (user.role !== "teacher") {
      router.replace("/dashboard");
    }
  }, [user.role, router]);

  if (user.role !== "teacher") {
    return <main className="p-6">Redirecting…</main>;
  }

  return <TeacherHistoryView />;
}
