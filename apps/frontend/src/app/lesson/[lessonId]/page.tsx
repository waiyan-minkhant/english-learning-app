"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Text } from "@/components/ui";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { LessonContainer } from "@/features/lesson/components/LessonContainer";
import { lessonService } from "@/services/lessonService";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();

  return (
    <RequireAuth fallback={<main className="p-6">Loading...</main>}>
      {() => <SoloLessonGate lessonId={params.lessonId} />}
    </RequireAuth>
  );
}

function SoloLessonGate({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: Boolean(lessonId),
    refetchOnWindowFocus: false
  });

  const progressStatus = lessonQuery.data?.progress.status;
  const allowed = progressStatus === "completed";

  useEffect(() => {
    if (!lessonQuery.isSuccess) return;
    if (progressStatus !== "completed") {
      router.replace("/practice");
    }
  }, [lessonQuery.isSuccess, progressStatus, router]);

  if (lessonQuery.isLoading) {
    return (
      <main className="flex h-screen items-center justify-center p-6">
        <Text variant="body">Loading lesson…</Text>
      </main>
    );
  }

  if (lessonQuery.error) {
    return (
      <main className="flex h-screen items-center justify-center p-6">
        <Text variant="body" tone="danger">
          {lessonQuery.error instanceof Error
            ? lessonQuery.error.message
            : "Failed to load lesson"}
        </Text>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex h-screen items-center justify-center p-6">
        <Text variant="body">Redirecting to practice…</Text>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <LessonContainer lessonId={lessonId} mode="solo" />
    </main>
  );
}
