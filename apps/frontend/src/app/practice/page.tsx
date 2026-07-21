"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Text } from "@/components/ui";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { LessonListView } from "@/features/lesson/components/LessonListView";

export default function PracticePage() {
  return (
    <RequireAuth fallback={<main className="p-6">Loading...</main>}>
      {() => <PracticeContent />}
    </RequireAuth>
  );
}

function PracticeContent() {
  const router = useRouter();

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4 sm:px-12">
        <Text variant="title" as="h1">
          Solo practice
        </Text>
        <Link href="/dashboard">
          <Button type="button" variant="secondary">
            Back to dashboard
          </Button>
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <LessonListView
          onlyCompletedSelectable
          onSelectLesson={(lessonId) => {
            router.push(`/lesson/${lessonId}`);
          }}
        />
      </div>
    </main>
  );
}
