import type { AuthUser } from "@english-learning/contracts";
import type { Socket } from "socket.io";
import { parseCookies } from "../../../shared/utils/cookies.js";
import {
  AUTH_COOKIE_NAME,
  verifyToken
} from "../services/auth.service.js";

export function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
) {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return next(new Error("Unauthenticated"));
  }

  try {
    const user: AuthUser = verifyToken(token);
    (socket.data as { user: AuthUser }).user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
}
