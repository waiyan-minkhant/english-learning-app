"use client";

import { useMemo, type ReactNode } from "react";
import type { ParticipantControls } from "@english-learning/contracts/socket/schema";
import {
  MicrophoneIcon,
  MicrophoneOffIcon,
  MousePointerIcon,
  UsersIcon
} from "@/components/icons";
import { Badge, Button, Text } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/store/authStore";
import { useParticipantControlsForUser } from "@/features/classroom/hooks/useParticipantControls";
import {
  countActiveParticipants,
  sortParticipantsForDisplay
} from "@/features/classroom/lib/participantVisibility";
import { useParticipantControlsStore } from "@/features/classroom/store/participantControlsStore";
import { usePresenceStore } from "@/features/classroom/store/presenceStore";
import type { ParticipantControlsActions } from "@/features/realtime/hooks/useParticipantControlsSync";
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

type ParticipantControlsPanelProps = {
  className?: string;
  id?: string;
} & ParticipantControlsActions;

function ControlToggleButton({
  enabled,
  label,
  onClick,
  children
}: {
  enabled: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0",
        enabled ? "text-success" : "text-muted-foreground"
      )}
      aria-label={label}
      aria-pressed={enabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function StudentControlButtons({
  participant,
  updateParticipantControls
}: {
  participant: Presence;
  updateParticipantControls: ParticipantControlsActions["updateParticipantControls"];
}) {
  const effective = useParticipantControlsForUser(
    participant.userId,
    participant.role
  );

  return (
    <div className="flex shrink-0 items-center gap-1">
      <ControlToggleButton
        enabled={effective.cursorEnabled}
        label={
          effective.cursorEnabled
            ? `Disable cursor for ${participant.name}`
            : `Enable cursor for ${participant.name}`
        }
        onClick={() =>
          updateParticipantControls(participant.userId, {
            cursorEnabled: !effective.cursorEnabled
          })
        }
      >
        <MousePointerIcon size={16} className="text-inherit" />
      </ControlToggleButton>

      <ControlToggleButton
        enabled={effective.microphoneEnabled}
        label={
          effective.microphoneEnabled
            ? `Disable microphone for ${participant.name}`
            : `Enable microphone for ${participant.name}`
        }
        onClick={() =>
          updateParticipantControls(participant.userId, {
            microphoneEnabled: !effective.microphoneEnabled
          })
        }
      >
        {effective.microphoneEnabled ? (
          <MicrophoneIcon size={16} className="text-inherit" />
        ) : (
          <MicrophoneOffIcon size={16} className="text-inherit" />
        )}
      </ControlToggleButton>
    </div>
  );
}

function getStudentBulkState(
  participants: Presence[],
  controls: Record<string, ParticipantControls>
) {
  const students = participants.filter(
    (participant) => participant.role === "student"
  );

  if (students.length === 0) {
    return { allStudentsMicDisabled: true, allStudentsCursorDisabled: true };
  }

  const anyMicEnabled = students.some(
    (student) => controls[student.userId]?.microphoneEnabled === true
  );
  const anyCursorEnabled = students.some(
    (student) => controls[student.userId]?.cursorEnabled === true
  );

  return {
    allStudentsMicDisabled: !anyMicEnabled,
    allStudentsCursorDisabled: !anyCursorEnabled
  };
}

function PanelHeader({ activeCount }: { activeCount: number }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
      <Text variant="title" as="h2">
        Participants
      </Text>
      {activeCount > 0 ? (
        <Badge variant="secondary" className="shrink-0">
          {activeCount} online
        </Badge>
      ) : null}
    </div>
  );
}

function ParticipantRow({
  participant,
  currentUserId,
  isTeacher,
  updateParticipantControls
}: {
  participant: Presence;
  currentUserId: string | undefined;
  isTeacher: boolean;
  updateParticipantControls: ParticipantControlsActions["updateParticipantControls"];
}) {
  const config = STATUS_CONFIG[participant.status];
  const isYou = participant.userId === currentUserId;

  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60">
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
          config.dot
        )}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text variant="label" as="p" className="truncate">
          {participant.name}
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

      {isTeacher && participant.role === "student" ? (
        <StudentControlButtons
          participant={participant}
          updateParticipantControls={updateParticipantControls}
        />
      ) : (
        <Badge variant={config.badgeVariant} className="shrink-0">
          {config.label}
        </Badge>
      )}
    </li>
  );
}

function BulkActionsFooter({
  allStudentsMicDisabled,
  allStudentsCursorDisabled,
  updateBulkParticipantControls
}: {
  allStudentsMicDisabled: boolean;
  allStudentsCursorDisabled: boolean;
  updateBulkParticipantControls: ParticipantControlsActions["updateBulkParticipantControls"];
}) {
  const micLabel = allStudentsMicDisabled ? "Unmute all" : "Mute all";
  const cursorLabel = allStudentsCursorDisabled
    ? "Enable all cursors"
    : "Disable all cursors";

  return (
    <div className="shrink-0 border-t border-border bg-muted/30 px-3 py-2.5">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          aria-label={micLabel}
          onClick={() =>
            updateBulkParticipantControls({
              microphoneEnabled: allStudentsMicDisabled
            })
          }
        >
          {micLabel}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          aria-label={cursorLabel}
          onClick={() =>
            updateBulkParticipantControls({
              cursorEnabled: allStudentsCursorDisabled
            })
          }
        >
          {cursorLabel}
        </Button>
      </div>
    </div>
  );
}

export function ParticipantControlsPanel({
  className,
  id,
  updateParticipantControls,
  updateBulkParticipantControls
}: ParticipantControlsPanelProps) {
  const participants = usePresenceStore((state) => state.participants);
  const controls = useParticipantControlsStore((state) => state.controls);
  const currentUser = useCurrentUser();
  const activeCount = countActiveParticipants(participants);
  const sorted = sortParticipantsForDisplay(participants);
  const isTeacher = currentUser?.role === "teacher";

  const { allStudentsMicDisabled, allStudentsCursorDisabled } = useMemo(
    () => getStudentBulkState(participants, controls),
    [participants, controls]
  );

  return (
    <div
      id={id}
      className={cn(
        "flex w-80 min-w-[18rem] max-w-[22rem] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg",
        "max-h-[min(24rem,70vh)]",
        className
      )}
      aria-label="Participants and controls"
    >
      <PanelHeader activeCount={activeCount} />

      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {sorted.length === 0 ? (
          <li className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <UsersIcon
              size={28}
              className="text-muted-foreground/40"
              aria-hidden
            />
            <Text variant="caption" tone="muted">
              No one else here yet
            </Text>
          </li>
        ) : (
          sorted.map((participant) => (
            <ParticipantRow
              key={participant.userId}
              participant={participant}
              currentUserId={currentUser?.id}
              isTeacher={isTeacher}
              updateParticipantControls={updateParticipantControls}
            />
          ))
        )}
      </ul>

      {isTeacher ? (
        <BulkActionsFooter
          allStudentsMicDisabled={allStudentsMicDisabled}
          allStudentsCursorDisabled={allStudentsCursorDisabled}
          updateBulkParticipantControls={updateBulkParticipantControls}
        />
      ) : null}
    </div>
  );
}
