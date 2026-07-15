"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import type { Socket } from "socket.io-client";
import { Button, Text } from "@/components/ui";
import { CursorOverlay } from "@/features/classroom/components/CursorOverlay";
import { MediaControlsPopover } from "@/features/classroom/components/MediaControlsPopover";
import { ParticipantControlsPopover } from "@/features/classroom/components/ParticipantControlsPopover";
import { TeacherOfflineModal } from "@/features/classroom/components/TeacherOfflineModal";
import { Toolbar } from "@/features/classroom/components/Toolbar";
import { VideoGrid } from "@/features/classroom/components/VideoGrid";
import { ClassroomMediaProvider } from "@/features/classroom/context/ClassroomMediaContext";
import type { SessionUser } from "@/features/auth/lib/auth";
import { LessonContainer } from "@/features/lesson/components/LessonContainer";
import type { VideoTokenResponse } from "@/features/classroom/lib/video";
import { useUiStore } from "@/features/ui/store/uiStore";
import type { ParticipantControlsActions } from "@/features/realtime/hooks/useParticipantControlsSync";
import { cn } from "@/utils/cn";

type ClassroomViewProps = {
  roomId: string;
  currentUser: SessionUser;
  socketRef: RefObject<Socket | null>;
  session: VideoTokenResponse;
  onEndClass: () => void;
  onEndCall: () => void;
} & ParticipantControlsActions;

export function ClassroomView({
  roomId,
  currentUser,
  socketRef,
  session,
  onEndClass,
  onEndCall,
  updateParticipantControls,
  updateBulkParticipantControls
}: ClassroomViewProps) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [participantPopoverOpen, setParticipantPopoverOpen] = useState(false);
  const sidebarOpen = useUiStore((state) => state.classroomSidebarOpen);
  const videoServerUrl =
    process.env.NEXT_PUBLIC_LIVEKIT_URL ?? session.url;

  return (
    <ClassroomMediaProvider
      token={session.token}
      serverUrl={videoServerUrl}
      onEndCall={onEndCall}
    >
      <main className="flex h-screen w-screen overflow-hidden">
        <TeacherOfflineModal />

        <section
          className={cn(
            "relative flex h-full shrink-0 flex-col bg-background p-6 transition-[width] duration-200 ease-in-out",
            sidebarOpen ? "w-[80%]" : "w-full"
          )}
          aria-label="Lesson area"
        >
          <div
            className={cn(
              "relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col",
              "overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            )}
          >
            <LessonContainer
              mode="classroom"
              selectedLessonId={selectedLessonId}
              onSelectLesson={setSelectedLessonId}
              onChangeLesson={() => setSelectedLessonId(null)}
            />
            <CursorOverlay socketRef={socketRef} roomId={roomId} />
          </div>
          <Toolbar />
          <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3">
            {!sidebarOpen && !participantPopoverOpen ? (
              <MediaControlsPopover />
            ) : null}
            <ParticipantControlsPopover
              onOpenChange={setParticipantPopoverOpen}
              updateParticipantControls={updateParticipantControls}
              updateBulkParticipantControls={updateBulkParticipantControls}
            />
          </div>
        </section>

        <aside
          className={cn(
            "h-full shrink-0 overflow-hidden border-border transition-[width] duration-200 ease-in-out",
            sidebarOpen ? "w-[20%] border-l" : "w-0 border-l-0"
          )}
          aria-hidden={!sidebarOpen}
        >
          <div className="h-full w-[25vw] min-w-[240px] max-w-full">
            <VideoGrid
              className="h-full"
              onEndClass={
                currentUser.role === "teacher" ? onEndClass : undefined
              }
            />
          </div>
        </aside>
      </main>
    </ClassroomMediaProvider>
  );
}

export function ClassroomErrorView({
  error,
  onEndCall
}: {
  error: string;
  onEndCall: () => void;
}) {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center gap-4 overflow-hidden px-6">
      <Text variant="heading" as="h1">
        Could not join call
      </Text>
      <Text variant="body" tone="danger">
        {error}
      </Text>
      <Link href="/dashboard" onClick={onEndCall}>
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </main>
  );
}

export function ClassroomLoadingView() {
  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden">
      <Text variant="body">Connecting to room…</Text>
    </main>
  );
}
