export type SpeechProvider = {
  transcribe(audio: Buffer, mimeType: string): Promise<string>;
};
