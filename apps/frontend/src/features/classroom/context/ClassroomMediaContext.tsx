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
import { useParticipantControls } from "@/features/classroom/hooks/useParticipantControls";
import { useMediaPreferencesStore } from "@/features/media/store/mediaPreferencesStore";
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
  remoteAudioContainerRef: RefObject<HTMLDivElement | null>;
  micEnabled: boolean;
  camEnabled: boolean;
  connected: boolean;
  remoteCamEnabledByUserId: Record<string, boolean>;
  registerRemoteVideoContainer: (
    userId: string,
    element: HTMLDivElement | null
  ) => void;
  toggleMic: () => Promise<void>;
  toggleCam: () => Promise<void>;
  endCall: () => Promise<void>;
  syncLocalVideo: () => void;
  syncRemoteVideos: () => void;
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

function isRemoteVideoShowing(publication: RemoteTrackPublication) {
  return (
    isVideoPublication(publication) &&
    publication.isSubscribed &&
    !publication.isMuted &&
    !!publication.videoTrack
  );
}

function isExpectedConnectAbort(error: unknown) {
  return (
    error instanceof ConnectionError &&
    error.reason === ConnectionErrorReason.Cancelled
  );
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
  const remoteVideoContainersRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const remoteAudioContainerRef = useRef<HTMLDivElement>(null);
  const prevMicPermissionRef = useRef<boolean | null>(null);

  const [micEnabled, setMicEnabled] = useState(
    () => useMediaPreferencesStore.getState().micEnabled
  );
  const [camEnabled, setCamEnabled] = useState(
    () => useMediaPreferencesStore.getState().camEnabled
  );
  const [connected, setConnected] = useState(false);
  const [remoteCamEnabledByUserId, setRemoteCamEnabledByUserId] = useState<
    Record<string, boolean>
  >({});
  const { microphoneEnabled } = useParticipantControls();

  const attachLocalVideo = useCallback((room: Room) => {
    const container = localVideoRef.current;
    if (!container) return;

    if (!room.localParticipant.isCameraEnabled) {
      container.replaceChildren();
      return;
    }

    const publication = room.localParticipant.getTrackPublication(
      Track.Source.Camera
    );
    const track = publication?.videoTrack;
    if (track && !publication.isMuted) {
      attachTrack(track, container);
    } else {
      container.replaceChildren();
    }
  }, []);

  const attachAllRemoteVideos = useCallback((room: Room) => {
    const camState: Record<string, boolean> = {};
    const activeRemoteUserIds = new Set<string>();

    for (const participant of room.remoteParticipants.values()) {
      const userId = participant.identity;
      activeRemoteUserIds.add(userId);
      const container = remoteVideoContainersRef.current.get(userId);

      let attached = false;
      for (const publication of participant.trackPublications.values()) {
        if (
          isVideoPublication(publication) &&
          publication.isSubscribed &&
          publication.videoTrack
        ) {
          const showing = isRemoteVideoShowing(publication);
          if (container) {
            if (showing) {
              attachTrack(publication.videoTrack, container);
            } else {
              container.replaceChildren();
            }
          }
          camState[userId] = showing;
          attached = true;
          break;
        }
      }

      if (!attached) {
        container?.replaceChildren();
        camState[userId] = false;
      }
    }

    for (const [userId, container] of remoteVideoContainersRef.current) {
      if (!activeRemoteUserIds.has(userId)) {
        container.replaceChildren();
      }
    }

    setRemoteCamEnabledByUserId(camState);
  }, []);

  const clearRemoteMedia = useCallback(() => {
    for (const container of remoteVideoContainersRef.current.values()) {
      container.replaceChildren();
    }
    remoteAudioContainerRef.current?.replaceChildren();
    setRemoteCamEnabledByUserId({});
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

  const registerRemoteVideoContainer = useCallback(
    (userId: string, element: HTMLDivElement | null) => {
      if (element) {
        remoteVideoContainersRef.current.set(userId, element);
      } else {
        remoteVideoContainersRef.current.delete(userId);
      }

      const room = roomRef.current;
      if (room) {
        attachAllRemoteVideos(room);
      }
    },
    [attachAllRemoteVideos]
  );

  useEffect(() => {
    const room = new Room();
    roomRef.current = room;
    let active = true;

    const syncMedia = () => {
      const hasRemote = room.remoteParticipants.size > 0;
      attachLocalVideo(room);

      if (hasRemote) {
        attachAllRemoteVideos(room);
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

    room.on(RoomEvent.TrackMuted, (publication, participant) => {
      if (!active) return;
      if (participant.isLocal) {
        if (publication.kind === Track.Kind.Video) {
          setCamEnabled(false);
          localVideoRef.current?.replaceChildren();
        }
        return;
      }
      if (publication.kind !== Track.Kind.Video) return;
      const userId = participant.identity;
      remoteVideoContainersRef.current.get(userId)?.replaceChildren();
      setRemoteCamEnabledByUserId((prev) => ({ ...prev, [userId]: false }));
    });

    room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      if (!active) return;
      if (participant.isLocal) {
        if (publication.kind === Track.Kind.Video) {
          setCamEnabled(true);
          attachLocalVideo(room);
        }
        return;
      }
      if (publication.kind !== Track.Kind.Video) return;
      setRemoteCamEnabledByUserId((prev) => ({
        ...prev,
        [participant.identity]: true
      }));
      attachAllRemoteVideos(room);
    });

    async function connect() {
      try {
        const prefs = useMediaPreferencesStore.getState();
        await room.connect(serverUrl, token);
        await room.localParticipant.setCameraEnabled(prefs.camEnabled);
        await room.localParticipant.setMicrophoneEnabled(prefs.micEnabled);
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
    attachAllRemoteVideos,
    attachLocalVideo,
    attachRemoteAudio,
    clearRemoteMedia,
    serverUrl,
    token
  ]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;

    const prev = prevMicPermissionRef.current;
    prevMicPermissionRef.current = microphoneEnabled;

    // First run after connect: keep dashboard preference unless teacher permission denies mic.
    if (prev === null) {
      if (!microphoneEnabled) {
        void (async () => {
          await room.localParticipant.setMicrophoneEnabled(false);
          setMicEnabled(false);
        })();
      }
      return;
    }

    if (prev === microphoneEnabled) return;

    // Later permission changes from participant controls force LiveKit mic to match.
    void (async () => {
      await room.localParticipant.setMicrophoneEnabled(microphoneEnabled);
      setMicEnabled(microphoneEnabled);
    })();
  }, [connected, microphoneEnabled]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;
    if (!microphoneEnabled) return;

    const next = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, [microphoneEnabled]);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;

    const next = !room.localParticipant.isCameraEnabled;
    setCamEnabled(next);
    if (!next) {
      localVideoRef.current?.replaceChildren();
    }
    await room.localParticipant.setCameraEnabled(next);
    if (next) {
      attachLocalVideo(room);
    }
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

  const syncRemoteVideos = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    attachAllRemoteVideos(room);
  }, [attachAllRemoteVideos]);

  const value: ClassroomMediaContextValue = {
    localVideoRef,
    remoteAudioContainerRef,
    micEnabled,
    camEnabled,
    connected,
    remoteCamEnabledByUserId,
    registerRemoteVideoContainer,
    toggleMic,
    toggleCam,
    endCall,
    syncLocalVideo,
    syncRemoteVideos
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

export function useRemoteParticipantVideo(userId: string) {
  const { registerRemoteVideoContainer, remoteCamEnabledByUserId } =
    useClassroomMedia();

  const videoRef = useCallback(
    (element: HTMLDivElement | null) => {
      registerRemoteVideoContainer(userId, element);
    },
    [registerRemoteVideoContainer, userId]
  );

  return {
    videoRef,
    showVideo: remoteCamEnabledByUserId[userId] ?? false
  };
}
