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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";

type ClassroomMediaContextValue = {
  localVideoRef: RefObject<HTMLDivElement | null>;
  remoteVideoRef: RefObject<HTMLDivElement | null>;
  remoteAudioContainerRef: RefObject<HTMLDivElement | null>;
  micEnabled: boolean;
  camEnabled: boolean;
  connected: boolean;
  hasRemoteParticipant: boolean;
  remoteCamEnabled: boolean;
  toggleMic: () => Promise<void>;
  toggleCam: () => Promise<void>;
  endCall: () => Promise<void>;
  syncLocalVideo: () => void;
  syncRemoteVideo: () => void;
};

const ClassroomMediaContext = createContext<ClassroomMediaContextValue | null>(
  null
);

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

function isExpectedConnectAbort(error: unknown) {
  return (
    error instanceof ConnectionError &&
    error.reason === ConnectionErrorReason.Cancelled
  );
}

function hasRemoteVideoTrack(room: Room): boolean {
  for (const participant of room.remoteParticipants.values()) {
    for (const publication of participant.trackPublications.values()) {
      if (
        isVideoPublication(publication) &&
        publication.isSubscribed &&
        !publication.isMuted &&
        publication.videoTrack
      ) {
        return true;
      }
    }
  }
  return false;
}

type ClassroomMediaProviderProps = {
  token: string;
  serverUrl: string;
  onEndCall?: () => void | Promise<void>;
  children: ReactNode;
};

export function ClassroomMediaProvider({
  token,
  serverUrl,
  onEndCall,
  children
}: ClassroomMediaProviderProps) {
  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const remoteAudioContainerRef = useRef<HTMLDivElement>(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [remoteCamEnabled, setRemoteCamEnabled] = useState(false);

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
      setRemoteCamEnabled(hasRemote && hasRemoteVideoTrack(room));
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

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;

    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, []);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;

    const next = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCamEnabled(next);
    attachLocalVideo(room);
  }, [attachLocalVideo]);

  const endCall = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    await onEndCall?.();
    if (room.state !== ConnectionState.Disconnected) {
      await room.disconnect();
    }
  }, [onEndCall]);

  const syncLocalVideo = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    attachLocalVideo(room);
  }, [attachLocalVideo]);

  const syncRemoteVideo = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    attachRemoteVideo(room);
    setRemoteCamEnabled(hasRemoteVideoTrack(room));
  }, [attachRemoteVideo]);

  const value: ClassroomMediaContextValue = {
    localVideoRef,
    remoteVideoRef,
    remoteAudioContainerRef,
    micEnabled,
    camEnabled,
    connected,
    hasRemoteParticipant,
    remoteCamEnabled,
    toggleMic,
    toggleCam,
    endCall,
    syncLocalVideo,
    syncRemoteVideo
  };

  return (
    <ClassroomMediaContext.Provider value={value}>
      {children}
    </ClassroomMediaContext.Provider>
  );
}

export function useClassroomMedia() {
  const context = useContext(ClassroomMediaContext);
  if (!context) {
    throw new Error("useClassroomMedia must be used within ClassroomMediaProvider");
  }
  return context;
}
