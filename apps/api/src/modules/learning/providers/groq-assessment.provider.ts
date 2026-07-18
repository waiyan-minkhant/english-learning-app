import {
  conversationAssessmentResultSchema,
  type ConversationAssessmentResult
} from "@english-learning/contracts/learning";
import Groq from "groq-sdk";
import { ExternalServiceError } from "../../../shared/errors/external-service-error.js";
import type {
  AssessmentContext,
  AssessmentProvider
} from "./assessment.provider.js";

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ExternalServiceError("GROQ_API_KEY is not configured");
  }
  return {
    apiKey,
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL
  };
}

function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    throw new Error("Model response is not valid JSON");
  }
}

export class GroqAssessmentProvider implements AssessmentProvider {
  private readonly client: Groq;
  private readonly model: string;

  constructor(config = getGroqConfig()) {
    this.client = new Groq({ apiKey: config.apiKey });
    this.model = config.model;
  }

  async assess(
    context: AssessmentContext
  ): Promise<ConversationAssessmentResult> {
    const systemPrompt = [
      "You are an English teacher assessing a student's spoken conversation exercise.",
      "Score each category from 1 to 5 (integers only).",
      "Return ONLY a JSON object with keys:",
      "answeredQuestion, grammar, vocabulary, sentenceCompleteness, feedback, transcript.",
      "feedback should be short, encouraging, and actionable (1-3 sentences).",
      "Echo the student transcript in the transcript field."
    ].join(" ");

    const userPayload = {
      lessonId: context.lessonId,
      exerciseId: context.exerciseId,
      exerciseType: context.exerciseType,
      lessonTitle: context.lessonTitle,
      exerciseTitle: context.exerciseTitle,
      prompt: context.prompt,
      expectedTopics: context.expectedTopics ?? [],
      transcript: context.transcript
    };

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify(userPayload)
          }
        ]
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new ExternalServiceError("Groq returned an empty assessment");
      }

      const parsed = conversationAssessmentResultSchema.safeParse(
        extractJsonObject(content)
      );
      if (!parsed.success) {
        throw new ExternalServiceError(
          "Groq assessment response was invalid",
          parsed.error.flatten()
        );
      }

      return {
        ...parsed.data,
        transcript: parsed.data.transcript ?? context.transcript
      };
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        "Groq assessment failed",
        error instanceof Error ? error.message : error
      );
    }
  }
}
