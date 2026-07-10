import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api-client";

export function createSocket(): Socket {
  return io(API_BASE_URL, { withCredentials: true });
}

export function disconnectSocket(socket: Socket | null) {
  if (socket?.connected) {
    socket.disconnect();
  }
}
