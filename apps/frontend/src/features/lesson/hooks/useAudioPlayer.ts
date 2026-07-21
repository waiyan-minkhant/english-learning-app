"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audioRef.current = null;
  }, []);

  const play = useCallback(
    async (url: string) => {
      stop();
      setError(null);
      const audio = new Audio(url);
      audioRef.current = audio;
      try {
        await audio.play();
      } catch (err) {
        audioRef.current = null;
        const message =
          err instanceof Error ? err.message : "Could not play audio";
        setError(message);
        throw err;
      }
    },
    [stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { play, stop, error };
}
