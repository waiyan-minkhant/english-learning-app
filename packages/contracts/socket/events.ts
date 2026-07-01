export const clientEvents = {
  joinSession: "join_session",
  leaveSession: "leave_session",
  endSession: "end_session",
  moveCursor: "move_cursor"
} as const;

export const serverEvents = {
  presenceUpdated: "presence_updated",
  participantLeft: "participant_left",
  participantDisconnected: "participant_disconnected",
  teacherOffline: "teacher_offline",
  sessionEnded: "session_ended",
  cursorMoved: "cursor_moved"
} as const;

export type ClientEvent = (typeof clientEvents)[keyof typeof clientEvents];

export type ServerEvent = (typeof serverEvents)[keyof typeof serverEvents];
