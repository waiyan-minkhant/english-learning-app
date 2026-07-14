import type { Presence } from "@/lib/socket/listeners";

export function isParticipantOnlineForCursor(status: Presence["status"]) {
  return status === "online";
}

export function isActiveParticipantStatus(status: Presence["status"]) {
  return status === "online" || status === "reconnecting";
}

export function countActiveParticipants(participants: Presence[]) {
  return participants.filter((participant) =>
    isActiveParticipantStatus(participant.status)
  ).length;
}

export function isRemoteVideoTileVisible(participant: Presence | undefined) {
  if (!participant) return false;
  return participant.status === "online";
}

export function sortParticipantsForDisplay(participants: Presence[]) {
  const statusOrder = { online: 0, reconnecting: 1, offline: 2 };
  return [...participants].sort((a, b) => {
    const roleOrder = a.role === "teacher" ? -1 : b.role === "teacher" ? 1 : 0;
    if (roleOrder !== 0) return roleOrder;
    return statusOrder[a.status] - statusOrder[b.status];
  });
}
