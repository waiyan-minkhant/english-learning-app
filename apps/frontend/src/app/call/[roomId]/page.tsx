"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { CallRoom } from "@/components/call-room";
import { LessonCanvas } from "@/components/lesson-canvas";
import { PresencePanel } from "@/components/presence-panel";
import { Button } from "@/components/ui/button";
import { getVideoToken, meRequest } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import {
  parseParticipantEventPayload,
  parsePresenceUpdatedPayload,
  parseSessionEndedPayload,
  parseTeacherOfflinePayload,
  clientEvents,
  serverEvents,
  type Presence
} from "@/lib/realtime";
import type { VideoTokenResponse } from "@/lib/video";
import { cn } from "@/lib/utils";

const TEACHER_OFFLINE_COUNTDOWN_SECONDS = 5;

export default function CallPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [session, setSession] = useState<VideoTokenResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [participants, setParticipants] = useState<Presence[]>([]);
  const [teacherOfflineCountdown, setTeacherOfflineCountdown] = useState<
    number | null
  >(null);
  const socketRef = useRef<Socket | null>(null);
  const manualLeaveRef = useRef(false);

  const leaveRealtimeSession = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    manualLeaveRef.current = true;
    socket.emit(clientEvents.leaveSession, roomId);
    socket.disconnect();
    socketRef.current = null;
  }, [roomId]);

  const handleEndCall = useCallback(() => {
    leaveRealtimeSession();
    router.push("/dashboard");
  }, [leaveRealtimeSession, router]);

  const handleSessionEnded = useCallback(() => {
    manualLeaveRef.current = true;
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.disconnect();
    }
    socketRef.current = null;
    router.push("/dashboard");
  }, [router]);

  const handleSessionEndedRef = useRef(handleSessionEnded);
  handleSessionEndedRef.current = handleSessionEnded;

  const handleEndClass = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit(clientEvents.endSession, roomId);
  }, [roomId]);

  useEffect(() => {
    if (teacherOfflineCountdown === null) return;

    if (teacherOfflineCountdown <= 0) {
      handleSessionEndedRef.current();
      return;
    }

    const timerId = window.setTimeout(() => {
      setTeacherOfflineCountdown((seconds) =>
        seconds === null ? null : seconds - 1
      );
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [teacherOfflineCountdown]);

  useEffect(() => {
    let active = true;
    manualLeaveRef.current = false;
    setLoading(true);
    setSession(null);
    setError(null);
    setParticipants([]);
    setTeacherOfflineCountdown(null);

    async function setup() {
      try {
        const me = await meRequest();
        if (!active) return;
        setCurrentUser(me.user);

        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const socket = io(apiBaseUrl, { withCredentials: true });
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("[realtime] connected", { socketId: socket.id });
          socket.emit(clientEvents.joinSession, roomId);
          console.log("[realtime] emitted join_session", { roomId });
        });

        socket.on("disconnect", (reason) => {
          console.log("[realtime] disconnected", { reason, manualLeave: manualLeaveRef.current });
        });

        socket.on("connect_error", (err) => {
          console.log("[realtime] connect_error", { message: err.message });
        });

        socket.on(serverEvents.presenceUpdated, (payload: unknown) => {
          try {
            const parsed = parsePresenceUpdatedPayload(payload);
            if (parsed.sessionId === roomId) {
              setParticipants(parsed.participants);
            }
          } catch {
            console.warn("[realtime] invalid presence_updated payload");
          }
        });

        socket.on(serverEvents.participantLeft, (payload: unknown) => {
          const parsed = parseParticipantEventPayload(payload);
          console.log("[realtime] participant_left", parsed);
        });

        socket.on(
          serverEvents.participantDisconnected,
          (payload: unknown) => {
            const parsed = parseParticipantEventPayload(payload);
            console.log("[realtime] participant_disconnected", parsed);
          }
        );

        socket.on(serverEvents.teacherOffline, (payload: unknown) => {
          try {
            const parsed = parseTeacherOfflinePayload(payload);
            console.log("[realtime] teacher_offline", parsed);
            if (parsed.sessionId === roomId) {
              setTeacherOfflineCountdown(TEACHER_OFFLINE_COUNTDOWN_SECONDS);
            }
          } catch {
            console.warn("[realtime] invalid teacher_offline payload");
          }
        });

        socket.on(serverEvents.sessionEnded, (payload: unknown) => {
          const parsed = parseSessionEndedPayload(payload);
          console.log("[realtime] session_ended", parsed);
          if (parsed.sessionId === roomId) {
            setTeacherOfflineCountdown(null);
            handleSessionEndedRef.current();
          }
        });

        const credentials = await getVideoToken(roomId);
        if (!active) return;
        setSession(credentials);
      } catch (connectError) {
        if (!active) return;
        const message =
          connectError instanceof Error
            ? connectError.message
            : "Failed to join call";
        setError(message);
        if (message.toLowerCase().includes("unauthenticated")) {
          router.replace("/login");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    setup();

    return () => {
      active = false;
      const socket = socketRef.current;
      if (socket) {
        if (manualLeaveRef.current && socket.connected) {
          console.log("[realtime] cleanup after manual leave");
        } else {
          console.log("[realtime] cleanup disconnect (refresh/unmount)");
        }
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, router]);

  if (loading) {
    return (
      <main className="flex h-screen w-screen items-center justify-center overflow-hidden">
        <p className="text-slate-600">Connecting to room…</p>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="flex h-screen w-screen flex-col items-center justify-center gap-4 overflow-hidden px-6">
        <h1 className="text-2xl font-bold">Could not join call</h1>
        <p className="text-red-600">{error ?? "Unknown error"}</p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-slate-100"
          onClick={handleEndCall}
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  const videoServerUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL ?? session.url;

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      {teacherOfflineCountdown !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="teacher-offline-title"
          aria-describedby="teacher-offline-description"
        >
          <div className="mx-4 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h2
              id="teacher-offline-title"
              className="text-lg font-semibold text-slate-900"
            >
              Teacher disconnected
            </h2>
            <p
              id="teacher-offline-description"
              className="mt-2 text-sm text-slate-600"
            >
              The teacher lost connection. This class will end automatically.
            </p>
            <p className="mt-4 text-center text-3xl font-bold tabular-nums text-slate-900">
              {Math.max(teacherOfflineCountdown, 0)}
            </p>
            <p className="mt-1 text-center text-xs text-slate-500">
              seconds remaining
            </p>
          </div>
        </div>
      ) : null}
      <section
        className={cn(
          "relative h-full shrink-0 bg-slate-100 transition-[width] duration-200 ease-in-out",
          sidebarOpen ? "w-[80%]" : "w-full"
        )}
        aria-label="Lesson canvas"
      >
        <LessonCanvas
          socketRef={socketRef}
          roomId={roomId}
          currentUser={currentUser}
          participants={participants}
        />
        {currentUser?.role === "teacher" ? (
          <Button
            type="button"
            variant="destructive"
            className="absolute left-4 top-4 z-10"
            onClick={handleEndClass}
          >
            End class
          </Button>
        ) : null}
        <PresencePanel
          participants={participants}
          currentUserId={currentUser?.id}
          className={cn(
            "absolute left-4 z-10",
            currentUser?.role === "teacher" ? "top-16" : "top-4"
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 translate-x-1/2 rounded-full border bg-background shadow-md"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? "Hide video panel" : "Show video panel"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </section>

      <aside
        className={cn(
          "h-full shrink-0 overflow-hidden border-border transition-[width] duration-200 ease-in-out",
          sidebarOpen ? "w-[20%] border-l" : "w-0 border-l-0"
        )}
        aria-hidden={!sidebarOpen}
      >
        <div className="h-full w-[25vw] min-w-[240px] max-w-full">
          <CallRoom
            token={session.token}
            serverUrl={videoServerUrl}
            onEndCall={handleEndCall}
            className="h-full"
          />
        </div>
      </aside>
    </main>
  );
}
