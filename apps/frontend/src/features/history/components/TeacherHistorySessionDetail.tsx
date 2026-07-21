"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { SessionAttempt } from "@english-learning/contracts/learning-session";
import { Button, Card, CardContent, Text } from "@/components/ui";
import { classService } from "@/services/classService";
import { learningSessionService } from "@/services/learningSessionService";
import { lessonService } from "@/services/lessonService";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function attemptTypeLabel(type: SessionAttempt["type"]) {
  switch (type) {
    case "conversation":
      return "Conversation";
    case "fill_in_blank":
      return "Fill in the blank";
    case "listen_and_fill_in_blank":
      return "Listen and fill in the blank";
    case "listen_and_build_sentence":
      return "Listen and build sentence";
    case "matching":
      return "Matching";
    case "listen_and_speak":
      return "Listen and speak";
    default:
      return type;
  }
}

function AttemptDetails({ attempt }: { attempt: SessionAttempt }) {
  return (
    <div className="mt-2 space-y-1 text-body-14 text-muted-foreground">
      {attempt.correct !== undefined ? (
        <p>Result: {attempt.correct ? "Correct" : "Incorrect"}</p>
      ) : null}
      {attempt.selectedAnswer !== undefined ? (
        <p>Answer: {attempt.selectedAnswer}</p>
      ) : null}
      {attempt.submittedOrder ? (
        <p>Order: {attempt.submittedOrder.join(" → ")}</p>
      ) : null}
      {attempt.selectedPairs ? (
        <p>
          Pairs:{" "}
          {Object.entries(attempt.selectedPairs)
            .map(([left, right]) => `${left} → ${right}`)
            .join(", ")}
        </p>
      ) : null}
      {attempt.transcript !== undefined ? (
        <p>Transcript: {attempt.transcript || "(empty)"}</p>
      ) : null}
      {attempt.feedback !== undefined ? (
        <p>Feedback: {attempt.feedback || "(none)"}</p>
      ) : null}
      {attempt.pronunciationScore !== undefined &&
      attempt.pronunciationScore !== null ? (
        <p>Pronunciation: {attempt.pronunciationScore}</p>
      ) : null}
      {attempt.scores ? (
        <p>
          Scores — answered: {attempt.scores.answeredQuestion}, grammar:{" "}
          {attempt.scores.grammar}, vocabulary: {attempt.scores.vocabulary},
          completeness: {attempt.scores.sentenceCompleteness}
        </p>
      ) : null}
      <p>
        <Text variant="caption">Item: {attempt.lessonItemId}</Text>
      </p>
    </div>
  );
}

export function TeacherHistorySessionDetail() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  const initialStudentId = searchParams.get("studentId");

  const [filterUserId, setFilterUserId] = useState<string | null>(
    initialStudentId
  );

  const sessionQuery = useQuery({
    queryKey: ["learning-session", sessionId],
    queryFn: () => learningSessionService.get(sessionId),
    enabled: Boolean(sessionId)
  });

  const courseQuery = useQuery({
    queryKey: ["course", lessonService.getDefaultCourseId()],
    queryFn: () => lessonService.getCourse()
  });

  const rosterQuery = useQuery({
    queryKey: ["class", "me"],
    queryFn: () => classService.getMine()
  });

  const attemptsQuery = useQuery({
    queryKey: ["learning-session-attempts", sessionId, filterUserId],
    queryFn: () =>
      learningSessionService.listAttempts(
        sessionId,
        filterUserId ?? undefined
      ),
    enabled: Boolean(sessionId)
  });

  const lessonTitle = useMemo(() => {
    const lessonId = sessionQuery.data?.lessonId;
    if (!lessonId) return null;
    const lesson = courseQuery.data?.lessons.find((l) => l.id === lessonId);
    return lesson
      ? `Lesson ${lesson.number}: ${lesson.title}`
      : lessonId;
  }, [sessionQuery.data?.lessonId, courseQuery.data?.lessons]);

  const studentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const student of rosterQuery.data?.students ?? []) {
      map[student.id] = student.name;
    }
    return map;
  }, [rosterQuery.data?.students]);

  // Load unfiltered attempt user ids for classroom filter chips
  const allAttemptsQuery = useQuery({
    queryKey: ["learning-session-attempts", sessionId, "all"],
    queryFn: () => learningSessionService.listAttempts(sessionId),
    enabled:
      Boolean(sessionId) && sessionQuery.data?.mode === "classroom"
  });

  const classroomFilterIds = useMemo(() => {
    if (sessionQuery.data?.mode !== "classroom") return [];
    const ids = new Set<string>();
    for (const attempt of allAttemptsQuery.data ?? []) {
      ids.add(attempt.userId);
    }
    return [...ids];
  }, [allAttemptsQuery.data, sessionQuery.data?.mode]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Text variant="heading" size="title-32" as="h1">
            Session attempts
          </Text>
          <Text variant="body">
            {lessonTitle ?? "Loading…"}
            {sessionQuery.data
              ? ` · ${sessionQuery.data.mode} · ${sessionQuery.data.status}`
              : ""}
          </Text>
          {sessionQuery.data ? (
            <Text variant="body" size="body-14">
              Started {formatWhen(sessionQuery.data.startedAt)}
              {sessionQuery.data.endedAt
                ? ` · ended ${formatWhen(sessionQuery.data.endedAt)}`
                : ""}
            </Text>
          ) : null}
        </div>
        <Link href="/teacher/history">
          <Button type="button" variant="secondary">
            Back to history
          </Button>
        </Link>
      </div>

      {sessionQuery.data?.mode === "classroom" &&
      classroomFilterIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={filterUserId === null ? "primary" : "secondary"}
            onClick={() => setFilterUserId(null)}
          >
            All students
          </Button>
          {classroomFilterIds.map((userId) => (
            <Button
              key={userId}
              type="button"
              variant={filterUserId === userId ? "primary" : "secondary"}
              onClick={() => setFilterUserId(userId)}
            >
              {studentNameById[userId] ?? userId.slice(0, 8)}
            </Button>
          ))}
        </div>
      ) : null}

      {sessionQuery.isLoading || attemptsQuery.isLoading ? (
        <Text variant="body">Loading attempts…</Text>
      ) : sessionQuery.error || attemptsQuery.error ? (
        <Text variant="body" tone="danger">
          {(sessionQuery.error ?? attemptsQuery.error) instanceof Error
            ? (sessionQuery.error ?? attemptsQuery.error)!.message
            : "Failed to load session"}
        </Text>
      ) : (attemptsQuery.data ?? []).length === 0 ? (
        <Text variant="body">No attempts recorded for this session.</Text>
      ) : (
        <ul className="flex flex-col gap-3">
          {(attemptsQuery.data ?? []).map((attempt) => (
            <li key={attempt.id}>
              <Card>
                <CardContent className="py-4">
                  <Text variant="body" weight="semibold">
                    {attemptTypeLabel(attempt.type)}
                  </Text>
                  <Text variant="body" size="body-14">
                    {studentNameById[attempt.userId] ??
                      attempt.userId.slice(0, 8)}{" "}
                    · {formatWhen(attempt.createdAt)}
                  </Text>
                  <AttemptDetails attempt={attempt} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
