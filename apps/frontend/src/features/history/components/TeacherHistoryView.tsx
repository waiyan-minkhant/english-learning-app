"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, Text } from "@/components/ui";
import { classService } from "@/services/classService";
import { learningSessionService } from "@/services/learningSessionService";
import { lessonService } from "@/services/lessonService";
import { cn } from "@/utils/cn";

type Tab = "classroom" | "solo";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function TeacherHistoryView() {
  const [tab, setTab] = useState<Tab>("classroom");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );

  const courseQuery = useQuery({
    queryKey: ["course", lessonService.getDefaultCourseId()],
    queryFn: () => lessonService.getCourse()
  });

  const lessonTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const lesson of courseQuery.data?.lessons ?? []) {
      map[lesson.id] = `Lesson ${lesson.number}: ${lesson.title}`;
    }
    return map;
  }, [courseQuery.data?.lessons]);

  const rosterQuery = useQuery({
    queryKey: ["class", "me"],
    queryFn: () => classService.getMine(),
    enabled: tab === "solo"
  });

  const classroomSessionsQuery = useQuery({
    queryKey: ["learning-sessions", "classroom"],
    queryFn: () => learningSessionService.list({ mode: "classroom" }),
    enabled: tab === "classroom"
  });

  const soloSessionsQuery = useQuery({
    queryKey: ["learning-sessions", "solo", selectedStudentId],
    queryFn: () =>
      learningSessionService.list({
        mode: "solo",
        userId: selectedStudentId!
      }),
    enabled: tab === "solo" && Boolean(selectedStudentId)
  });

  const classroomGroups = useMemo(() => {
    const sessions = classroomSessionsQuery.data ?? [];
    const byLive = new Map<
      string,
      { liveKey: string; roomId: string | null; sessions: typeof sessions }
    >();

    for (const session of sessions) {
      const liveKey = session.liveSessionId ?? session.id;
      const existing = byLive.get(liveKey);
      if (existing) {
        existing.sessions.push(session);
      } else {
        byLive.set(liveKey, {
          liveKey,
          roomId: session.liveSessionRoomId ?? null,
          sessions: [session]
        });
      }
    }

    return [...byLive.values()].sort((a, b) => {
      const aTime = Math.max(
        ...a.sessions.map((s) => new Date(s.startedAt).getTime())
      );
      const bTime = Math.max(
        ...b.sessions.map((s) => new Date(s.startedAt).getTime())
      );
      return bTime - aTime;
    });
  }, [classroomSessionsQuery.data]);

  const students = rosterQuery.data?.students ?? [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Text variant="heading" size="title-32" as="h1">
            Student learning history
          </Text>
          <Text variant="body">
            Review classroom and solo practice attempts for your class.
          </Text>
        </div>
        <Link href="/dashboard">
          <Button type="button" variant="secondary">
            Back to dashboard
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={tab === "classroom" ? "primary" : "secondary"}
          onClick={() => setTab("classroom")}
        >
          Classroom
        </Button>
        <Button
          type="button"
          variant={tab === "solo" ? "primary" : "secondary"}
          onClick={() => setTab("solo")}
        >
          Solo practice
        </Button>
      </div>

      {tab === "classroom" ? (
        <section className="flex flex-col gap-4">
          {classroomSessionsQuery.isLoading ? (
            <Text variant="body">Loading classroom sessions…</Text>
          ) : classroomSessionsQuery.error ? (
            <Text variant="body" tone="danger">
              {classroomSessionsQuery.error instanceof Error
                ? classroomSessionsQuery.error.message
                : "Failed to load sessions"}
            </Text>
          ) : classroomGroups.length === 0 ? (
            <Text variant="body">No classroom learning sessions yet.</Text>
          ) : (
            classroomGroups.map((group) => (
              <Card key={group.liveKey}>
                <CardContent className="flex flex-col gap-3">
                  <div>
                    <Text variant="title" as="h2">
                      Live class
                      {group.roomId ? ` · ${group.roomId}` : ""}
                    </Text>
                    <Text variant="body" size="body-14">
                      {group.sessions.length} lesson session
                      {group.sessions.length === 1 ? "" : "s"}
                    </Text>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {group.sessions
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.startedAt).getTime() -
                          new Date(a.startedAt).getTime()
                      )
                      .map((session) => (
                        <li key={session.id}>
                          <Link
                            href={`/teacher/history/${session.id}`}
                            className="block rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40"
                          >
                            <Text variant="body" weight="semibold">
                              {lessonTitleById[session.lessonId] ??
                                session.lessonId}
                            </Text>
                            <Text variant="body" size="body-14">
                              {session.status} · started{" "}
                              {formatWhen(session.startedAt)}
                              {session.endedAt
                                ? ` · ended ${formatWhen(session.endedAt)}`
                                : ""}
                            </Text>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          {rosterQuery.isLoading ? (
            <Text variant="body">Loading students…</Text>
          ) : rosterQuery.error ? (
            <Text variant="body" tone="danger">
              {rosterQuery.error instanceof Error
                ? rosterQuery.error.message
                : "Failed to load class roster"}
            </Text>
          ) : students.length === 0 ? (
            <Text variant="body">No students in your class.</Text>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {students.map((student) => (
                  <Button
                    key={student.id}
                    type="button"
                    variant={
                      selectedStudentId === student.id
                        ? "primary"
                        : "secondary"
                    }
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    {student.name}
                  </Button>
                ))}
              </div>

              {!selectedStudentId ? (
                <Text variant="body">Select a student to view solo history.</Text>
              ) : soloSessionsQuery.isLoading ? (
                <Text variant="body">Loading solo sessions…</Text>
              ) : soloSessionsQuery.error ? (
                <Text variant="body" tone="danger">
                  {soloSessionsQuery.error instanceof Error
                    ? soloSessionsQuery.error.message
                    : "Failed to load solo sessions"}
                </Text>
              ) : (soloSessionsQuery.data ?? []).length === 0 ? (
                <Text variant="body">No solo sessions for this student.</Text>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(soloSessionsQuery.data ?? []).map((session) => (
                    <li key={session.id}>
                      <Link
                        href={`/teacher/history/${session.id}?studentId=${selectedStudentId}`}
                        className={cn(
                          "block rounded-lg border border-border bg-surface px-4 py-3",
                          "transition-colors hover:bg-muted/40"
                        )}
                      >
                        <Text variant="body" weight="semibold">
                          {lessonTitleById[session.lessonId] ??
                            session.lessonId}
                        </Text>
                        <Text variant="body" size="body-14">
                          {session.status} · started{" "}
                          {formatWhen(session.startedAt)}
                          {session.endedAt
                            ? ` · ended ${formatWhen(session.endedAt)}`
                            : ""}
                        </Text>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
