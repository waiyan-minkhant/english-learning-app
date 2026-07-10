import { fetchApi } from "@/lib/api-client";
import {
  parseVideoTokenResponse,
  type VideoTokenResponse
} from "@/features/classroom/lib/video";

export const videoService = {
  async getToken(roomName: string): Promise<VideoTokenResponse> {
    return parseVideoTokenResponse(
      await fetchApi("/video/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName })
      })
    );
  }
};
