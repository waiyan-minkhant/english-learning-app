"use client";

import { useParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { LessonContainer } from "@/features/lesson/components/LessonContainer";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();

  return (
    <RequireAuth fallback={<main className="p-6">Loading...</main>}>
      {() => (
        <main className="h-screen w-screen overflow-hidden">
          <LessonContainer lessonId={params.lessonId} mode="solo" />
        </main>
      )}
    </RequireAuth>
  );
}
