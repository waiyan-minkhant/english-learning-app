"use client";

import type { ReactNode } from "react";
import {
  CameraIcon,
  CameraOffIcon,
  MessageIcon,
  MicrophoneIcon,
  MicrophoneOffIcon,
  SettingsIcon
} from "@/components/icons";
import {
  controlPanelCellVariants,
  controlPanelCircleVariants,
  controlPanelLabelVariants,
  controlPanelShellVariants
} from "@/features/classroom/components/controlPanelVariants";
import { cn } from "@/utils/cn";

type ControlPanelCellProps = {
  label: string;
  tone: "primary" | "muted";
  disabled?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

function ControlPanelCell({
  label,
  tone,
  disabled,
  interactive = false,
  onClick,
  children
}: ControlPanelCellProps) {
  const iconClassName =
    tone === "primary" ? "text-primary-foreground" : "text-icon";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={controlPanelCellVariants({ interactive })}
    >
      <span className={controlPanelCircleVariants({ tone })}>
        <span className={cn("inline-flex", iconClassName)}>{children}</span>
      </span>
      <span className={controlPanelLabelVariants()}>{label}</span>
    </button>
  );
}

type ClassroomControlPanelProps = {
  camEnabled: boolean;
  micEnabled: boolean;
  connected: boolean;
  toggleCam: () => Promise<void>;
  toggleMic: () => Promise<void>;
};

export function ClassroomControlPanel({
  camEnabled,
  micEnabled,
  connected,
  toggleCam,
  toggleMic
}: ClassroomControlPanelProps) {
  return (
    <div className={controlPanelShellVariants()}>
      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        <ControlPanelCell
          label="Camera"
          tone={camEnabled ? "primary" : "muted"}
          disabled={!connected}
          interactive
          onClick={() => void toggleCam()}
        >
          {camEnabled ? (
            <CameraIcon size={20} className="text-inherit" />
          ) : (
            <CameraOffIcon size={20} className="text-inherit" />
          )}
        </ControlPanelCell>

        <ControlPanelCell
          label="Mic"
          tone={micEnabled ? "primary" : "muted"}
          disabled={!connected}
          interactive
          onClick={() => void toggleMic()}
        >
          {micEnabled ? (
            <MicrophoneIcon size={20} className="text-inherit" />
          ) : (
            <MicrophoneOffIcon size={20} className="text-inherit" />
          )}
        </ControlPanelCell>

        <ControlPanelCell label="Message" tone="muted" disabled>
          <MessageIcon size={20} className="text-inherit" />
        </ControlPanelCell>

        <ControlPanelCell label="Settings" tone="muted" disabled>
          <SettingsIcon size={20} className="text-inherit" />
        </ControlPanelCell>
      </div>
    </div>
  );
}
