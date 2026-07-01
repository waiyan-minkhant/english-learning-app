"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import type { SessionUser } from "@/lib/auth";
import {
  cursorColorForUser,
  normalizePointer,
  shouldEmitCursorMove,
  throttle
} from "@/lib/cursor";
import {
  clientEvents,
  parseCursorMovedPayload,
  serverEvents,
  type Presence
} from "@/lib/realtime";
import { cn } from "@/lib/utils";

type RemoteCursor = {
  userId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  label: string;
  color: string;
};

type LessonCanvasProps = {
  socketRef: RefObject<Socket | null>;
  roomId: string;
  currentUser?: SessionUser | null;
  participants: Presence[];
  className?: string;
};

export function LessonCanvas({
  socketRef,
  roomId,
  currentUser,
  participants,
  className
}: LessonCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef<Map<string, RemoteCursor>>(new Map());
  const lastSentPxRef = useRef<number | null>(null);
  const lastSentPyRef = useRef<number | null>(null);
  const [, setFrame] = useState(0);

  const participantById = new Map(
    participants.map((p) => [p.userId, p])
  );

  useEffect(() => {
    const ids = new Set(participants.map((p) => p.userId));
    let changed = false;
    for (const id of cursorsRef.current.keys()) {
      if (!ids.has(id)) {
        cursorsRef.current.delete(id);
        changed = true;
      }
    }
    if (changed) setFrame((f) => f + 1);
  }, [participants]);

  useEffect(() => {
    let rafId = 0;

    const animate = () => {
      let dirty = false;
      for (const cursor of cursorsRef.current.values()) {
        const dx = cursor.targetX - cursor.x;
        const dy = cursor.targetY - cursor.y;
        if (Math.abs(dx) > 0.0005 || Math.abs(dy) > 0.0005) {
          cursor.x += dx * 0.2;
          cursor.y += dy * 0.2;
          dirty = true;
        }
      }
      if (dirty) setFrame((f) => f + 1);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onCursorMoved = (payload: unknown) => {
      try {
        const parsed = parseCursorMovedPayload(payload);
        if (parsed.sessionId !== roomId) return;
        if (parsed.userId === currentUser?.id) return;

        const participant = participantById.get(parsed.userId);
        let cursor = cursorsRef.current.get(parsed.userId);
        if (!cursor) {
          cursor = {
            userId: parsed.userId,
            x: parsed.x,
            y: parsed.y,
            targetX: parsed.x,
            targetY: parsed.y,
            label: participant?.email ?? "Guest",
            color: cursorColorForUser(parsed.userId)
          };
          cursorsRef.current.set(parsed.userId, cursor);
        }

        cursor.targetX = parsed.x;
        cursor.targetY = parsed.y;
        if (participant) {
          cursor.label = participant.email;
        }
        setFrame((f) => f + 1);
      } catch {
        // ignore invalid payloads
      }
    };

    socket.on(serverEvents.cursorMoved, onCursorMoved);
    return () => {
      socket.off(serverEvents.cursorMoved, onCursorMoved);
    };
  }, [socketRef, roomId, currentUser?.id, participants]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const emitMove = throttle((clientX: number, clientY: number) => {
      const socket = socketRef.current;
      if (!socket?.connected) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const px = clientX - rect.left;
      const py = clientY - rect.top;

      if (
        !shouldEmitCursorMove(
          lastSentPxRef.current,
          lastSentPyRef.current,
          px,
          py
        )
      ) {
        return;
      }

      lastSentPxRef.current = px;
      lastSentPyRef.current = py;

      const { x, y } = normalizePointer(rect, clientX, clientY);
      socket.emit(clientEvents.moveCursor, { sessionId: roomId, x, y });
    }, 50);

    const onMouseMove = (e: MouseEvent) => {
      emitMove(e.clientX, e.clientY);
    };

    el.addEventListener("mousemove", onMouseMove);
    return () => el.removeEventListener("mousemove", onMouseMove);
  }, [socketRef, roomId]);

  const remoteCursors = Array.from(cursorsRef.current.values());

  return (
    <div
      ref={canvasRef}
      className={cn("absolute inset-0", className)}
      aria-label="Collaborative lesson canvas"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {remoteCursors.map((cursor) => (
          <div
            key={cursor.userId}
            className="absolute z-[1] flex items-center gap-1.5"
            style={{
              left: `${cursor.x * 100}%`,
              top: `${cursor.y * 100}%`,
              transform: "translate(-2px, -2px)"
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={cursor.color}
              className="drop-shadow-sm"
              aria-hidden
            >
              <path d="M5.5 3.5L19 12 10.5 13.5 8 21z" />
            </svg>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
