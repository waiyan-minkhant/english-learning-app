"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import {
  normalizePointer,
  shouldEmitCursorMove,
  throttle
} from "@/features/realtime/lib/cursor";
import { useCursorStore } from "@/features/classroom/store/cursorStore";
import { emitMoveCursor } from "@/lib/socket/emit";
import { cn } from "@/utils/cn";

type CursorOverlayProps = {
  socketRef: RefObject<Socket | null>;
  roomId: string;
  className?: string;
};

export function CursorOverlay({
  socketRef,
  roomId,
  className
}: CursorOverlayProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastSentPxRef = useRef<number | null>(null);
  const lastSentPyRef = useRef<number | null>(null);
  const cursors = useCursorStore((state) => state.cursors);
  const animateCursors = useCursorStore((state) => state.animateCursors);

  useEffect(() => {
    let rafId = 0;

    const animate = () => {
      animateCursors();
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [animateCursors]);

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
      emitMoveCursor(socket, { sessionId: roomId, x, y });
    }, 50);

    const onMouseMove = (e: MouseEvent) => {
      emitMove(e.clientX, e.clientY);
    };

    el.addEventListener("mousemove", onMouseMove);
    return () => el.removeEventListener("mousemove", onMouseMove);
  }, [socketRef, roomId]);

  const remoteCursors = Object.values(cursors);

  return (
    <div
      ref={canvasRef}
      className={cn("absolute inset-0 z-20", className)}
      aria-label="Collaborative cursor overlay"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
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
