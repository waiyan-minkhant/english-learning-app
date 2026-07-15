"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { useParticipantControlsStore } from "@/features/classroom/store/participantControlsStore";
import type { ParticipantControls } from "@english-learning/contracts/socket/schema";

const DEFAULT_STUDENT_CONTROLS: ParticipantControls = {
  microphoneEnabled: false,
  cursorEnabled: false
};

const ENABLED_TEACHER_CONTROLS: ParticipantControls = {
  microphoneEnabled: true,
  cursorEnabled: true
};

export function useParticipantControls() {
  const currentUser = useCurrentUser();
  const controls = useParticipantControlsStore((state) => state.controls);

  return useMemo(() => {
    if (!currentUser) {
      return DEFAULT_STUDENT_CONTROLS;
    }

    if (currentUser.role === "teacher") {
      return ENABLED_TEACHER_CONTROLS;
    }

    return controls[currentUser.id] ?? DEFAULT_STUDENT_CONTROLS;
  }, [currentUser, controls]);
}

export function useParticipantControlsForUser(
  userId: string,
  role: "teacher" | "student"
) {
  const controls = useParticipantControlsStore((state) => state.controls);

  return useMemo(() => {
    if (role === "teacher") {
      return ENABLED_TEACHER_CONTROLS;
    }

    return controls[userId] ?? DEFAULT_STUDENT_CONTROLS;
  }, [role, userId, controls]);
}
