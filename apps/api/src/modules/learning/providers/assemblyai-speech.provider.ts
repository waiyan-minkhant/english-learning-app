import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

function extensionForMime(mimeType: string) {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  switch (base) {
    case "audio/webm":
      return "webm";
    case "audio/mp4":
    case "audio/m4a":
    case "audio/x-m4a":
      return "m4a";
    case "audio/ogg":
      return "ogg";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/wav":
    case "audio/wave":
    case "audio/x-wav":
      return "wav";
    default:
      return "webm";
  }
}

export class AssemblyAISpeechProvider implements SpeechProvider {
  private readonly client: AssemblyAI;

  constructor(apiKey = getAssemblyAiApiKey()) {
    this.client = new AssemblyAI({ apiKey });
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    const type = mimeType?.trim() || "audio/webm";
    const tempPath = join(
      tmpdir(),
      `speech-${randomUUID()}.${extensionForMime(type)}`
    );

    try {
      await writeFile(tempPath, audio);

      const uploadUrl = await this.client.files.upload(tempPath);
      const transcript = await this.client.transcripts.transcribe({
        audio_url: uploadUrl,
        language_code: "en"
      });

      if (transcript.status === "error") {
        const detail =
          typeof transcript.error === "string" && transcript.error.trim()
            ? transcript.error.trim()
            : "Unknown AssemblyAI error";
        throw new ExternalServiceError(
          `AssemblyAI transcription failed: ${detail}`,
          transcript.error
        );
      }

      const text = transcript.text?.trim();
      if (!text) {
        throw new ExternalServiceError(
          "AssemblyAI returned an empty transcript. Speak clearly for at least one second and try again."
        );
      }

      return text;
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      const detail =
        error instanceof Error ? error.message : String(error ?? "unknown");
      throw new ExternalServiceError(
        `AssemblyAI transcription failed: ${detail}`,
        detail
      );
    } finally {
      await unlink(tempPath).catch(() => undefined);
    }
  }
}
