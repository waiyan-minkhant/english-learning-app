import * as connectionState from "../state/connection.state.js";

export async function bindSocket(
  socketId: string,
  roomId: string,
  userId: string
) {
  await connectionState.bindConnection(socketId, { roomId, userId });
}

export async function getConnection(socketId: string) {
  return connectionState.getConnection(socketId);
}

export async function unbindSocket(socketId: string) {
  await connectionState.unbindConnection(socketId);
}

export async function clearConnectionsForRoom(roomId: string) {
  await connectionState.clearConnectionsForRoom(roomId);
}
