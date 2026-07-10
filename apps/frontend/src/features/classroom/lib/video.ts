import {
  videoTokenResponseSchema,
  type VideoTokenResponse
} from "@english-learning/contracts/video";

export type { VideoTokenResponse };

export function parseVideoTokenResponse(data: unknown): VideoTokenResponse {
  return videoTokenResponseSchema.parse(data);
}
