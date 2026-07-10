"use client";

import { Badge, Text } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { countActiveParticipants } from "@/features/classroom/lib/participantVisibility";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import { cn } from "@/utils/cn";
import type { Presence } from "@/lib/socket/listeners";

const STATUS_CONFIG = {
  online: {
    label: "Online",
    dot: "bg-success",
    badgeVariant: "success" as const
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-warning animate-pulse",
    badgeVariant: "warning" as const
  },
  offline: {
    label: "Offline",
    dot: "bg-muted-foreground",
    badgeVariant: "secondary" as const
  }
} as const;

type ParticipantListPanelProps = {
  className?: string;
  id?: string;
};

function sortParticipants(participants: Presence[]) {
  const statusOrder = { online: 0, reconnecting: 1, offline: 2 };
  return [...participants].sort((a, b) => {
    const roleOrder = a.role === "teacher" ? -1 : b.role === "teacher" ? 1 : 0;
    if (roleOrder !== 0) return roleOrder;
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

export function ParticipantListPanel({
  className,
  id
}: ParticipantListPanelProps) {
  const participants = usePresenceStore((state) => state.participants);
  const currentUser = useCurrentUser();
  const activeCount = countActiveParticipants(participants);
  const sorted = sortParticipants(participants);

  return (
    <div
      id={id}
      className={cn(
        "w-88 rounded-lg border border-border bg-white shadow-md backdrop-blur-sm",
        className
      )}
      aria-label="Participants in room"
    >
      <div className="border-b border-border px-4 py-3">
        <Text variant="title" as="h2">
          In this class
        </Text>
        <Text variant="caption">
          {activeCount === 0
            ? "Waiting for participants…"
            : `${activeCount} participant${activeCount === 1 ? "" : "s"}`}
        </Text>
      </div>

      <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto p-2">
        {sorted.length === 0 ? (
          <li className="px-2 py-3 text-center">
            <Text variant="caption">No one else here yet</Text>
          </li>
        ) : (
          sorted.map((participant) => {
            const config = STATUS_CONFIG[participant.status];
            const isYou = participant.userId === currentUser?.id;

            return (
              <li
                key={participant.userId}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <span
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-pill", config.dot)}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Text variant="label" as="p" className="truncate">
                    {participant.email}
                    {isYou ? (
                      <Text variant="caption" tone="muted" as="span">
                        {" "}
                        (you)
                      </Text>
                    ) : null}
                  </Text>
                  <Text variant="caption" as="p" className="capitalize">
                    {participant.role}
                  </Text>
                </div>
                <Badge variant={config.badgeVariant} className="shrink-0">
                  {config.label}
                </Badge>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export function ParticipantList(props: ParticipantListPanelProps) {
  return <ParticipantListPanel {...props} />;
}
