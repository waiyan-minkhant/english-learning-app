import type { ConversationAttemptResponse } from "@english-learning/contracts/learning";
import { fetchApi } from "@/lib/api-client";

export type SubmitConversationAttemptInput = {
  audio: Blob;
  lessonItemId: string;
  lessonId: string;
  learningSessionId: string;
};

export const conversationService = {
  async submitAttempt(
    input: SubmitConversationAttemptInput
  ): Promise<ConversationAttemptResponse> {
    const formData = new FormData();
    formData.append("audio", input.audio, "recording.webm");
    formData.append("lessonItemId", input.lessonItemId);
    formData.append("lessonId", input.lessonId);
    formData.append("learningSessionId", input.learningSessionId);

    return (await fetchApi("/learning/conversation/attempt", {
      method: "POST",
      body: formData
    })) as ConversationAttemptResponse;
  }
};
