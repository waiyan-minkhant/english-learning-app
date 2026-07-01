import { AccessToken } from "livekit-server-sdk";

function getVideoConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !url) {
    throw new Error(
      "LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL are required"
    );
  }

  return { apiKey, apiSecret, url };
}

export async function createVideoToken(opts: {
  roomName: string;
  participantIdentity: string;
  participantName?: string;
}) {
  const { apiKey, apiSecret, url } = getVideoConfig();

  const token = new AccessToken(apiKey, apiSecret, {
    identity: opts.participantIdentity,
    name: opts.participantName,
    ttl: "1h"
  });

  token.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: true,
    canSubscribe: true
  });

  return {
    token: await token.toJwt(),
    url
  };
}
