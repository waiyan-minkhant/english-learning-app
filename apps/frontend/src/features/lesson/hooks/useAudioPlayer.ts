"use client";

import { useCallback, useEffect, useRef } from "react";

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audioRef.current = null;
  }, []);

  const play = useCallback(
    (url: string) => {
      stop();
      const audio = new Audio(url);
      audioRef.current = audio;
      void audio.play().catch(() => {
        audioRef.current = null;
      });
    },
    [stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { play, stop };
}
