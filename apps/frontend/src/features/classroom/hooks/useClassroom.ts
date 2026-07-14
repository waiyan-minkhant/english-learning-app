"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useVideoToken } from "@/features/classroom/hooks/useVideoToken";
import { useCursor } from "@/features/realtime/hooks/useCursor";
import { usePresence } from "@/features/realtime/hooks/usePresence";
import { useRealtimeConnection } from "@/features/realtime/hooks/useRealtimeConnection";
import { useParticipantControlsSync } from "@/features/realtime/hooks/useParticipantControlsSync";
import { useTeacherStatus } from "@/features/realtime/hooks/useTeacherStatus";

export function useClassroom(roomId: string) {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const currentUser = useCurrentUser();
  const connection = useRealtimeConnection(roomId);

  usePresence(roomId, connection.socketRef);
  const participantControls = useParticipantControlsSync(
    roomId,
    connection.socketRef
  );

  const handleSessionEnded = useCallback(() => {
    connection.manualLeaveRef.current = true;
    connection.leaveSession();
    router.push("/dashboard");
  }, [connection, router]);

  const teacherStatus = useTeacherStatus({
    roomId,
    socketRef: connection.socketRef,
    onSessionEnded: handleSessionEnded
  });

  useCursor({
    roomId,
    socketRef: connection.socketRef,
    currentUserId: currentUser?.id
  });

  const video = useVideoToken(roomId);

  const handleEndCall = useCallback(() => {
    connection.leaveSession();
    router.push("/dashboard");
  }, [connection, router]);

  const loading = authLoading || video.isLoading;
  const error =
    video.error instanceof Error
      ? video.error.message
      : !currentUser && !authLoading
        ? "Unauthenticated"
        : null;

  return {
    roomId,
    currentUser,
    socketRef: connection.socketRef,
    session: video.data,
    loading,
    error,
    endClass: teacherStatus.endClass,
    endCall: handleEndCall,
    updateParticipantControls: participantControls.updateParticipantControls,
    updateBulkParticipantControls:
      participantControls.updateBulkParticipantControls
  };
}
