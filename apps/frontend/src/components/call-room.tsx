"use client";

import {
  ConnectionError,
  ConnectionErrorReason,
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type RemoteTrackPublication,
  type VideoTrack
} from "livekit-client";
import { Camera, CameraOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CallRoomProps = {
  token: string;
  serverUrl: string;
  /** User explicitly ended the call (e.g. hang up). Not fired on refresh/unmount. */
  onEndCall?: () => void | Promise<void>;
  className?: string;
};

function attachTrack(track: VideoTrack, container: HTMLDivElement) {
  const element = track.attach();
  element.className = "h-full w-full object-cover";
  container.replaceChildren(element);
}

function isVideoPublication(
  publication: LocalTrackPublication | RemoteTrackPublication
) {
  return publication.kind === Track.Kind.Video;
}

/** Expected when effect cleanup disconnects during an in-flight connect (e.g. Strict Mode). */
function isExpectedConnectAbort(error: unknown) {
  return (
    error instanceof ConnectionError &&
    error.reason === ConnectionErrorReason.Cancelled
  );
}

export function CallRoom({
  token,
  serverUrl,
  onEndCall,
  className
}: CallRoomProps) {
  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const remoteAudioContainerRef = useRef<HTMLDivElement>(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);

  const attachLocalVideo = useCallback((room: Room) => {
    const container = localVideoRef.current;
    if (!container) return;

    const publication = room.localParticipant.getTrackPublication(
      Track.Source.Camera
    );
    const track = publication?.videoTrack;
    if (track) {
      attachTrack(track, container);
    } else {
      container.replaceChildren();
    }
  }, []);

  const clearRemoteMedia = useCallback(() => {
    remoteVideoRef.current?.replaceChildren();
    remoteAudioContainerRef.current?.replaceChildren();
  }, []);

  const attachRemoteVideo = useCallback((room: Room) => {
    const container = remoteVideoRef.current;
    if (!container) return;

    for (const participant of room.remoteParticipants.values()) {
      for (const publication of participant.trackPublications.values()) {
        if (
          isVideoPublication(publication) &&
          publication.isSubscribed &&
          publication.videoTrack
        ) {
          attachTrack(publication.videoTrack, container);
          return;
        }
      }
    }

    container.replaceChildren();
  }, []);

  const attachRemoteAudio = useCallback((room: Room) => {
    const container = remoteAudioContainerRef.current;
    if (!container) return;

    container.replaceChildren();

    for (const participant of room.remoteParticipants.values()) {
      for (const publication of participant.trackPublications.values()) {
        if (
          publication.kind === Track.Kind.Audio &&
          publication.isSubscribed &&
          publication.audioTrack
        ) {
          const element = publication.audioTrack.attach();
          element.className = "hidden";
          container.appendChild(element);
        }
      }
    }
  }, []);

  useEffect(() => {
    const room = new Room();
    roomRef.current = room;
    let active = true;

    const syncMedia = () => {
      const hasRemote = room.remoteParticipants.size > 0;
      setHasRemoteParticipant(hasRemote);
      attachLocalVideo(room);

      if (hasRemote) {
        attachRemoteVideo(room);
        attachRemoteAudio(room);
      } else {
        clearRemoteMedia();
      }
    };

    room.on(RoomEvent.Connected, () => {
      if (!active) return;
      setConnected(true);
      syncMedia();
    });

    room.on(RoomEvent.Disconnected, () => {
      if (!active) return;
      setConnected(false);
    });

    room.on(RoomEvent.LocalTrackPublished, syncMedia);
    room.on(RoomEvent.LocalTrackUnpublished, syncMedia);
    room.on(RoomEvent.TrackSubscribed, syncMedia);
    room.on(RoomEvent.TrackUnsubscribed, syncMedia);
    room.on(RoomEvent.ParticipantConnected, syncMedia);
    room.on(RoomEvent.ParticipantDisconnected, syncMedia);

    async function connect() {
      try {
        await room.connect(serverUrl, token);
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
        if (!active) return;
        setMicEnabled(room.localParticipant.isMicrophoneEnabled);
        setCamEnabled(room.localParticipant.isCameraEnabled);
        syncMedia();
      } catch (error) {
        if (!active || isExpectedConnectAbort(error)) return;
        console.error("Failed to connect to LiveKit room:", error);
      }
    }

    void connect();

    return () => {
      active = false;
      void room.disconnect();
      roomRef.current = null;
    };
  }, [
    attachLocalVideo,
    attachRemoteAudio,
    attachRemoteVideo,
    clearRemoteMedia,
    serverUrl,
    token
  ]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || !hasRemoteParticipant) return;

    attachRemoteVideo(room);
    attachRemoteAudio(room);
  }, [hasRemoteParticipant, attachRemoteVideo, attachRemoteAudio]);

  async function toggleMic() {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;

    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }

  async function toggleCam() {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;

    const next = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCamEnabled(next);
    attachLocalVideo(room);
  }

  async function endCall() {
    const room = roomRef.current;
    if (!room) return;

    await onEndCall?.();
    if (room.state !== ConnectionState.Disconnected) {
      await room.disconnect();
    }
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div
        className="relative min-h-0 flex-1 overflow-hidden border-b bg-slate-900"
        aria-label="Your camera"
      >
        <span className="absolute left-2 top-2 z-10 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
          You
        </span>
        <div ref={localVideoRef} className="h-full w-full" />
      </div>

      {hasRemoteParticipant ? (
        <div
          className="relative min-h-0 flex-1 overflow-hidden border-b bg-slate-900"
          aria-label="Remote participant camera"
        >
          <span className="absolute left-2 top-2 z-10 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
            Remote
          </span>
          <div ref={remoteVideoRef} className="h-full w-full" />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 items-center justify-center gap-3 border-b bg-background px-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
          onClick={toggleMic}
          disabled={!connected}
        >
          {micEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={camEnabled ? "Turn off camera" : "Turn on camera"}
          onClick={toggleCam}
          disabled={!connected}
        >
          {camEnabled ? (
            <Camera className="h-4 w-4" />
          ) : (
            <CameraOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          aria-label="End call"
          onClick={endCall}
          disabled={!connected}
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>

      {!hasRemoteParticipant ? (
        <div className="min-h-0 flex-1" aria-hidden />
      ) : null}

      <div ref={remoteAudioContainerRef} className="hidden" aria-hidden />
    </div>
  );
}
