import {
  conversationAttemptResponseSchema,
  type ConversationAttemptResponse
} from "@english-learning/contracts/learning";
import { fetchApi } from "@/lib/api-client";

export type SubmitConversationAttemptInput = {
  audio: Blob;
  exerciseId: string;
  lessonId: string;
  lessonTitle: string;
  exerciseTitle: string;
  question: string;
  sessionId?: string;
  expectedTopics?: string[];
};

export const conversationService = {
  async submitAttempt(
    input: SubmitConversationAttemptInput
  ): Promise<ConversationAttemptResponse> {
    const formData = new FormData();
    formData.append("audio", input.audio, "recording.webm");
    formData.append("exerciseId", input.exerciseId);
    formData.append("lessonId", input.lessonId);
    formData.append("lessonTitle", input.lessonTitle);
    formData.append("exerciseTitle", input.exerciseTitle);
    formData.append("question", input.question);

    if (input.sessionId) {
      formData.append("sessionId", input.sessionId);
    }

    if (input.expectedTopics?.length) {
      formData.append(
        "expectedTopics",
        JSON.stringify(input.expectedTopics)
      );
    }

    return conversationAttemptResponseSchema.parse(
      await fetchApi("/learning/conversation/attempt", {
        method: "POST",
        body: formData
      })
    );
  }
};
