"use client";

import { useQuery } from "@tanstack/react-query";
import { useLessonViewModel } from "@/features/lesson/hooks/useLessonViewModel";
import { lessonService } from "@/services/lessonService";

export function useLesson(lessonId: string) {
  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonService.getLesson(lessonId),
    enabled: !!lessonId,
    refetchOnWindowFocus: false
  });
  const viewModel = useLessonViewModel(lessonId);

  return {
    ...viewModel,
    lesson: lessonQuery.data?.lesson,
    progress: lessonQuery.data?.progress,
    isLoading: lessonQuery.isLoading || viewModel.isLoading,
    error: lessonQuery.error ?? viewModel.error
  };
}
