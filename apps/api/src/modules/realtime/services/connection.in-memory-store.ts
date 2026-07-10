// For unit tests to mock the connection store instead of Redis

import type { ConnectionRecord } from "../state/connection.state.js";

export class InMemoryConnectionStore {
  private connections = new Map<string, ConnectionRecord>();

  async bindConnection(socketId: string, record: ConnectionRecord) {
    this.connections.set(socketId, { ...record });
  }

  async getConnection(socketId: string): Promise<ConnectionRecord | null> {
    const connection = this.connections.get(socketId);
    return connection ? { ...connection } : null;
  }

  async unbindConnection(socketId: string) {
    this.connections.delete(socketId);
  }

  async clearConnectionsForRoom(roomId: string) {
    for (const [socketId, connection] of this.connections) {
      if (connection.roomId === roomId) {
        this.connections.delete(socketId);
      }
    }
  }

  reset() {
    this.connections.clear();
  }
}
