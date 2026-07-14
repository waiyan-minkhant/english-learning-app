"use client";

import { useEffect, useRef } from "react";
import {
  CameraIcon,
  CameraOffIcon,
  MicrophoneIcon,
  MicrophoneOffIcon
} from "@/components/icons";
import { Avatar, Text } from "@/components/ui";
import { useMediaPreferencesStore } from "@/features/media/store/mediaPreferencesStore";
import { cn } from "@/utils/cn";

type MediaPrepPanelProps = {
  userName: string;
  className?: string;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function MediaPrepPanel({ userName, className }: MediaPrepPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const micEnabled = useMediaPreferencesStore((state) => state.micEnabled);
  const camEnabled = useMediaPreferencesStore((state) => state.camEnabled);
  const permission = useMediaPreferencesStore((state) => state.permission);
  const toggleMic = useMediaPreferencesStore((state) => state.toggleMic);
  const toggleCam = useMediaPreferencesStore((state) => state.toggleCam);
  const setPermission = useMediaPreferencesStore((state) => state.setPermission);

  useEffect(() => {
    let cancelled = false;

    async function requestMedia() {
      setPermission("unknown");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        if (cancelled) {
          stopStream(stream);
          return;
        }

        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });

        streamRef.current = stream;
        setPermission("granted");
      } catch {
        if (cancelled) return;
        streamRef.current = null;
        setPermission("denied");
      }
    }

    void requestMedia();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [setPermission]);

  useEffect(() => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || permission !== "granted") return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = camEnabled;
    });
    // Mic preference is store-only on the dashboard; keep audio tracks muted.
    stream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });

    if (camEnabled && video) {
      video.srcObject = stream;
      void video.play().catch(() => {
        // Autoplay can fail if the tab is backgrounded; ignore.
      });
    } else if (video) {
      video.srcObject = null;
    }
  }, [camEnabled, permission]);

  const fallback = userName.charAt(0).toUpperCase() || "?";
  const controlsDisabled = permission !== "granted";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-media">
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            !(camEnabled && permission === "granted") && "invisible"
          )}
          playsInline
          muted
          autoPlay
        />
        {!(camEnabled && permission === "granted") ? (
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 bg-surface p-5 text-center">
            <Avatar fallback={fallback} className="h-16 w-16 text-title-20" />
            <Text variant="caption" tone="muted">
              {permission === "unknown"
                ? "Requesting camera and microphone…"
                : permission === "denied"
                  ? "Camera preview unavailable"
                  : "Camera is off"}
            </Text>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={micEnabled ? "Turn microphone off" : "Turn microphone on"}
          disabled={controlsDisabled}
          onClick={toggleMic}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            micEnabled
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-icon"
          )}
        >
          {micEnabled ? (
            <MicrophoneIcon size={20} className="text-inherit" />
          ) : (
            <MicrophoneOffIcon size={20} className="text-inherit" />
          )}
        </button>

        <button
          type="button"
          aria-label={camEnabled ? "Turn camera off" : "Turn camera on"}
          disabled={controlsDisabled}
          onClick={toggleCam}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            camEnabled
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-icon"
          )}
        >
          {camEnabled ? (
            <CameraIcon size={20} className="text-inherit" />
          ) : (
            <CameraOffIcon size={20} className="text-inherit" />
          )}
        </button>
      </div>

      {permission === "denied" ? (
        <Text variant="body" tone="danger">
          Camera and microphone access is required to join class. Allow access
          in your browser settings, then refresh this page.
        </Text>
      ) : null}
    </div>
  );
}
