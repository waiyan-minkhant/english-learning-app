"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { sessionService } from "@/services/sessionService";

export function useStartSession() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => sessionService.start(),
    onSuccess: ({ roomId }) => {
      router.push(`/call/${encodeURIComponent(roomId)}`);
    }
  });
}

export function useJoinSession() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => sessionService.join(),
    onSuccess: ({ roomId }) => {
      router.push(`/call/${encodeURIComponent(roomId)}`);
    }
  });
}
