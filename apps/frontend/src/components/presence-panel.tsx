import type { Presence } from "@/lib/realtime";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  online: {
    label: "Online",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200"
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-amber-500 animate-pulse",
    badge: "bg-amber-50 text-amber-800 border-amber-200"
  },
  offline: {
    label: "Offline",
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-600 border-slate-200"
  }
} as const;

type PresencePanelProps = {
  participants: Presence[];
  currentUserId?: string;
  className?: string;
};

function sortParticipants(participants: Presence[]) {
  const statusOrder = { online: 0, reconnecting: 1, offline: 2 };
  return [...participants].sort((a, b) => {
    const roleOrder = a.role === "teacher" ? -1 : b.role === "teacher" ? 1 : 0;
    if (roleOrder !== 0) return roleOrder;
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

export function PresencePanel({
  participants,
  currentUserId,
  className
}: PresencePanelProps) {
  const sorted = sortParticipants(participants);

  return (
    <div
      className={cn(
        "w-72 rounded-lg border border-slate-200 bg-white/95 shadow-md backdrop-blur-sm",
        className
      )}
      aria-label="Participants in room"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">In this class</h2>
        <p className="text-xs text-slate-500">
          {sorted.length === 0
            ? "Waiting for participants…"
            : `${sorted.length} participant${sorted.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <ul className="max-h-56 space-y-1 overflow-y-auto p-2">
        {sorted.length === 0 ? (
          <li className="px-2 py-3 text-center text-xs text-slate-500">
            No one else here yet
          </li>
        ) : (
          sorted.map((participant) => {
            const config = STATUS_CONFIG[participant.status];
            const isYou = participant.userId === currentUserId;

            return (
              <li
                key={participant.userId}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50"
              >
                <span
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-full", config.dot)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {participant.email}
                    {isYou ? (
                      <span className="font-normal text-slate-500"> (you)</span>
                    ) : null}
                  </p>
                  <p className="text-xs capitalize text-slate-500">
                    {participant.role}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    config.badge
                  )}
                >
                  {config.label}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
