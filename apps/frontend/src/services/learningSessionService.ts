import type { LearningSession } from "@english-learning/contracts/learning-session";
import {
  learningSessionAttemptsResponseSchema,
  learningSessionListResponseSchema,
  learningSessionResponseSchema
} from "@english-learning/contracts/learning-session";
import { fetchApi } from "@/lib/api-client";

export const learningSessionService = {
  async startSolo(lessonId: string): Promise<LearningSession> {
    const data = await fetchApi("/learning/sessions/solo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId })
    });
    return learningSessionResponseSchema.parse(data).session;
  },

  async startClassroom(input: {
    lessonId: string;
    roomId: string;
  }): Promise<LearningSession> {
    const data = await fetchApi("/learning/sessions/classroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    return learningSessionResponseSchema.parse(data).session;
  },

  async get(id: string): Promise<LearningSession> {
    const data = await fetchApi(`/learning/sessions/${id}`);
    return learningSessionResponseSchema.parse(data).session;
  },

  async end(id: string): Promise<LearningSession> {
    const data = await fetchApi(`/learning/sessions/${id}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    return learningSessionResponseSchema.parse(data).session;
  },

  async list(params?: {
    mode?: "solo" | "classroom";
    status?: "live" | "ended";
    lessonId?: string;
    roomId?: string;
    userId?: string;
  }): Promise<LearningSession[]> {
    const search = new URLSearchParams();
    if (params?.mode) search.set("mode", params.mode);
    if (params?.status) search.set("status", params.status);
    if (params?.lessonId) search.set("lessonId", params.lessonId);
    if (params?.roomId) search.set("roomId", params.roomId);
    if (params?.userId) search.set("userId", params.userId);
    const qs = search.toString();
    const data = await fetchApi(
      `/learning/sessions${qs ? `?${qs}` : ""}`
    );
    return learningSessionListResponseSchema.parse(data).sessions;
  },

  async listAttempts(id: string, userId?: string) {
    const search = new URLSearchParams();
    if (userId) search.set("userId", userId);
    const qs = search.toString();
    const data = await fetchApi(
      `/learning/sessions/${id}/attempts${qs ? `?${qs}` : ""}`
    );
    return learningSessionAttemptsResponseSchema.parse(data).attempts;
  }
};
