import { AssemblyAI } from "assemblyai";
import { ExternalServiceError } from "../../../shared/errors/external-service-error.js";
import type { SpeechProvider } from "./speech.provider.js";

function getAssemblyAiApiKey() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new ExternalServiceError("ASSEMBLYAI_API_KEY is not configured");
  }
  return apiKey;
}

export class AssemblyAISpeechProvider implements SpeechProvider {
  private readonly client: AssemblyAI;

  constructor(apiKey = getAssemblyAiApiKey()) {
    this.client = new AssemblyAI({ apiKey });
  }

  async transcribe(audio: Buffer, _mimeType: string): Promise<string> {
    try {
      const transcript = await this.client.transcripts.transcribe({
        audio
      });

      if (transcript.status === "error") {
        throw new ExternalServiceError(
          "AssemblyAI transcription failed",
          transcript.error
        );
      }

      const text = transcript.text?.trim();
      if (!text) {
        throw new ExternalServiceError(
          "AssemblyAI returned an empty transcript"
        );
      }

      return text;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      throw new ExternalServiceError(
        "AssemblyAI transcription failed",
        error instanceof Error ? error.message : error
      );
    }
  }
}
