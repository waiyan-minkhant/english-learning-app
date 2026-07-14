"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClassroomErrorView,
  ClassroomLoadingView,
  ClassroomView
} from "@/features/classroom/components/ClassroomView";
import { useClassroom } from "@/features/classroom/hooks/useClassroom";

export function ClassroomContainer() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();
  const classroom = useClassroom(roomId);

  useEffect(() => {
    if (
      classroom.error?.toLowerCase().includes("unauthenticated")
    ) {
      router.replace("/login");
    }
  }, [classroom.error, router]);

  if (classroom.loading) {
    return <ClassroomLoadingView />;
  }

  if (classroom.error || !classroom.session || !classroom.currentUser) {
    return (
      <ClassroomErrorView
        error={classroom.error ?? "Unknown error"}
        onEndCall={classroom.endCall}
      />
    );
  }

  return (
    <ClassroomView
      roomId={roomId}
      currentUser={classroom.currentUser}
      socketRef={classroom.socketRef}
      session={classroom.session}
      onEndClass={classroom.endClass}
      onEndCall={classroom.endCall}
      updateParticipantControls={classroom.updateParticipantControls}
      updateBulkParticipantControls={classroom.updateBulkParticipantControls}
    />
  );
}
