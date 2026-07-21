export const clientEvents = {
  joinSession: "join_session",
  leaveSession: "leave_session",
  endSession: "end_session",
  moveCursor: "move_cursor",
  updateParticipantControls: "update_participant_controls",
  updateBulkParticipantControls: "update_bulk_participant_controls",
  revealLessonAnswers: "lesson:reveal_answers",
  setLessonItem: "lesson:set_item"
} as const;

export const serverEvents = {
  presenceUpdated: "presence_updated",
  participantLeft: "participant_left",
  participantDisconnected: "participant_disconnected",
  teacherOffline: "teacher_offline",
  sessionEnded: "session_ended",
  cursorMoved: "cursor_moved",
  socketError: "socket_error",
  participantControlsUpdated: "participant_controls_updated",
  lessonAnswersRevealed: "lesson:answers_revealed",
  lessonStateUpdated: "lesson:state_updated",
  lessonAttemptSubmitted: "lesson:attempt_submitted"
} as const;

export type ClientEvent = (typeof clientEvents)[keyof typeof clientEvents];

export type ServerEvent = (typeof serverEvents)[keyof typeof serverEvents];
