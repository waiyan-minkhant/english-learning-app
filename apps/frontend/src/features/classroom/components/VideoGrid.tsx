"use client";

import { useEffect, useMemo } from "react";
import { PhoneOffIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { ClassroomControlPanel } from "@/features/classroom/components/ClassroomControlPanel";
import { ParticipantVideoTile } from "@/features/classroom/components/ParticipantVideoTile";
import {
  useClassroomMedia,
  useRemoteParticipantVideo
} from "@/features/classroom/context/ClassroomMediaContext";
import { useParticipantControls } from "@/features/classroom/hooks/useParticipantControls";
import {
  isRemoteVideoTileVisible,
  sortParticipantsForDisplay
} from "@/features/classroom/lib/participantVisibility";
import { getVideoScrollViewportStyle } from "@/features/classroom/lib/videoTileLayout";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import { cn } from "@/utils/cn";
import type { Presence } from "@/lib/socket/listeners";

function waitingFallback(name: string, fallback: string) {
  return name === "Waiting…" ? fallback : name.charAt(0).toUpperCase();
}

type VideoGridProps = {
  className?: string;
  onEndClass?: () => void;
};

function RemoteParticipantVideoTile({
  participant
}: {
  participant: Presence;
}) {
  const { videoRef, showVideo } = useRemoteParticipantVideo(participant.userId);

  return (
    <ParticipantVideoTile
      role={participant.role}
      name={participant.name}
      fallback={waitingFallback(
        participant.name,
        participant.role === "teacher" ? "T" : "S"
      )}
      showVideo={showVideo}
      videoRef={videoRef}
    />
  );
}

export function VideoGrid({ className, onEndClass }: VideoGridProps) {
  const participants = usePresenceStore((state) => state.participants);
  const currentUser = useCurrentUser();
  const {
    localVideoRef,
    remoteAudioContainerRef,
    micEnabled,
    camEnabled,
    connected,
    toggleMic,
    toggleCam,
    syncLocalVideo,
    syncRemoteVideos
  } = useClassroomMedia();
  const { microphoneEnabled } = useParticipantControls();

  useEffect(() => {
    syncLocalVideo();
    syncRemoteVideos();
  }, [syncLocalVideo, syncRemoteVideos]);

  const otherParticipants = useMemo(() => {
    return sortParticipantsForDisplay(
      participants.filter(
        (participant) => participant.userId !== currentUser?.id
      )
    ).filter((participant) => isRemoteVideoTileVisible(participant));
  }, [participants, currentUser?.id]);

  const localName = currentUser?.name ?? "You";
  const localRole = currentUser?.role ?? "student";
  const localShowVideo = camEnabled && connected;
  const totalTileCount = 1 + otherParticipants.length;
  const videoScrollStyle = getVideoScrollViewportStyle(totalTileCount);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-background p-4",
        className
      )}
    >
      {videoScrollStyle ? (
        <div
          className="min-h-0 flex-none overflow-hidden"
          style={videoScrollStyle}
        >
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden overscroll-contain">
            <ParticipantVideoTile
              role={localRole}
              name={localName}
              fallback={waitingFallback(
                localName,
                localRole === "teacher" ? "T" : "S"
              )}
              showVideo={localShowVideo}
              videoRef={localVideoRef}
              isYou
            />

            {otherParticipants.map((participant) => (
              <RemoteParticipantVideoTile
                key={participant.userId}
                participant={participant}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex shrink-0 flex-col gap-4 pt-4">
        <ClassroomControlPanel
          camEnabled={camEnabled}
          micEnabled={micEnabled}
          connected={connected}
          micAllowed={microphoneEnabled}
          toggleCam={toggleCam}
          toggleMic={toggleMic}
        />

        {onEndClass ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full text-white"
            aria-label="End class"
            onClick={onEndClass}
            disabled={!connected}
          >
            <PhoneOffIcon size={16} className="mr-2 text-primary-foreground" />
            End class
          </Button>
        ) : null}
      </div>

      <div ref={remoteAudioContainerRef} className="hidden" aria-hidden />
    </div>
  );
}
