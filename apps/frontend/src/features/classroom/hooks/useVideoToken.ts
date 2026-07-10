"use client";

import { useQuery } from "@tanstack/react-query";
import { videoService } from "@/services/videoService";

export function useVideoToken(roomId: string) {
  return useQuery({
    queryKey: ["video", "token", roomId],
    queryFn: () => videoService.getToken(roomId),
    enabled: !!roomId,
    retry: false
  });
}
