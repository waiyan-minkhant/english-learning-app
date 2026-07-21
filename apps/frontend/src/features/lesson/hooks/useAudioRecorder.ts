"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AudioRecorderStatus = "idle" | "recording";

const TIMESLICE_MS = 250;
const MIN_BLOB_BYTES = 2048;

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg"
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function useAudioRecorder() {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const start = useCallback(async () => {
    setError(null);

    if (typeof MediaRecorder === "undefined") {
      setError("Recording is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(TIMESLICE_MS);
      setStatus("recording");
    } catch {
      cleanupStream();
      setError("Microphone access was denied or unavailable");
      setStatus("idle");
    }
  }, [cleanupStream]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setStatus("idle");
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupStream();
        setStatus("idle");
        if (blob.size < MIN_BLOB_BYTES) {
          setError("Recording was too short. Please speak a bit longer.");
          resolve(null);
          return;
        }
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.stop();
    });
  }, [cleanupStream]);

  return { status, error, start, stop, setError };
}
