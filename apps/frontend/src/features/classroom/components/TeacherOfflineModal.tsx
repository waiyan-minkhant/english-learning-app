"use client";

import { Text } from "@/components/ui";
import { useClassroomStore } from "@/features/classroom/store/classroomStore";

export function TeacherOfflineModal() {
  const countdown = useClassroomStore((state) => state.teacherOfflineCountdown);

  if (countdown === null) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-overlay flex items-center justify-center bg-foreground/60"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="teacher-offline-title"
      aria-describedby="teacher-offline-description"
    >
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
        <Text id="teacher-offline-title" variant="heading" size="title-20" as="h2">
          Teacher disconnected
        </Text>
        <Text id="teacher-offline-description" variant="body" className="mt-2">
          The teacher lost connection. This class will end automatically.
        </Text>
        <Text
          variant="heading"
          size="title-32"
          className="mt-4 text-center tabular-nums"
        >
          {Math.max(countdown, 0)}
        </Text>
        <Text variant="caption" className="mt-1 text-center">
          seconds remaining
        </Text>
      </div>
    </div>
  );
}
