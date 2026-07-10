"use client";

import { useEffect } from "react";
import { PhoneOffIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { ClassroomControlPanel } from "@/features/classroom/components/ClassroomControlPanel";
import { ParticipantVideoTile } from "@/features/classroom/components/ParticipantVideoTile";
import { isRemoteVideoTileVisible } from "@/features/classroom/lib/participantVisibility";
import { useClassroomMedia } from "@/features/classroom/context/ClassroomMediaContext";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import { cn } from "@/utils/cn";

function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function waitingFallback(name: string, fallback: string) {
  return name === "Waiting…" ? fallback : name.charAt(0).toUpperCase();
}

type VideoGridProps = {
  className?: string;
  onEndClass?: () => void;
};

export function VideoGrid({ className, onEndClass }: VideoGridProps) {
  const participants = usePresenceStore((state) => state.participants);
  const currentUser = useCurrentUser();
  const {
    localVideoRef,
    remoteVideoRef,
    remoteAudioContainerRef,
    micEnabled,
    camEnabled,
    connected,
    hasRemoteParticipant,
    remoteCamEnabled,
    toggleMic,
    toggleCam,
    syncLocalVideo,
    syncRemoteVideo
  } = useClassroomMedia();

  useEffect(() => {
    syncLocalVideo();
    syncRemoteVideo();
  }, [syncLocalVideo, syncRemoteVideo]);

  const teacher = participants.find((p) => p.role === "teacher");
  const studentParticipant = participants.find((p) => p.role === "student");

  const teacherName = teacher
    ? displayNameFromEmail(teacher.email)
    : "Waiting…";

  const studentName =
    studentParticipant != null
      ? displayNameFromEmail(studentParticipant.email)
      : currentUser?.role === "student"
        ? displayNameFromEmail(currentUser.email)
        : "Waiting…";

  const isLocalStudent = currentUser?.role === "student";
  const isLocalTeacher = currentUser?.role === "teacher";
  const showStudentTile =
    isLocalStudent || isRemoteVideoTileVisible(studentParticipant);
  const showTeacherTile =
    isLocalTeacher || isRemoteVideoTileVisible(teacher);
  const localShowVideo = camEnabled && connected;
  const remoteShowVideo = remoteCamEnabled && hasRemoteParticipant;

  const studentShowVideo = isLocalStudent ? localShowVideo : remoteShowVideo;
  const teacherShowVideo = isLocalStudent ? remoteShowVideo : localShowVideo;

  const studentVideoRef = isLocalStudent ? localVideoRef : remoteVideoRef;
  const teacherVideoRef = isLocalStudent ? remoteVideoRef : localVideoRef;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col justify-start gap-4 overflow-y-auto bg-background p-4",
        className
      )}
    >
      {showStudentTile ? (
        <ParticipantVideoTile
          role="student"
          name={studentName}
          fallback={waitingFallback(studentName, "S")}
          showVideo={studentShowVideo}
          videoRef={studentVideoRef}
        />
      ) : null}

      {showTeacherTile ? (
        <ParticipantVideoTile
          role="teacher"
          name={teacherName}
          fallback={waitingFallback(teacherName, "T")}
          showVideo={teacherShowVideo}
          videoRef={teacherVideoRef}
        />
      ) : null}

      <ClassroomControlPanel
        camEnabled={camEnabled}
        micEnabled={micEnabled}
        connected={connected}
        toggleCam={toggleCam}
        toggleMic={toggleMic}
      />

      {onEndClass ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="w-full shrink-0 text-white"
          aria-label="End class"
          onClick={onEndClass}
          disabled={!connected}
        >
          <PhoneOffIcon size={16} className="mr-2 text-primary-foreground" />
          End class
        </Button>
      ) : null}

      <div ref={remoteAudioContainerRef} className="hidden" aria-hidden />
    </div>
  );
}
