import type {
  PresenceEntryRecord,
  SocketContextRecord
} from "../state/presence.state.js";

export class InMemoryPresenceStore {
  private roomMarkers = new Set<string>();
  private sessions = new Map<string, Map<string, PresenceEntryRecord>>();
  private sockets = new Map<string, SocketContextRecord>();

  async markSessionRoom(sessionId: string) {
    this.roomMarkers.add(sessionId);
  }

  async sessionRoomExists(sessionId: string) {
    return this.roomMarkers.has(sessionId);
  }

  async removeSessionRoomMarker(sessionId: string) {
    this.roomMarkers.delete(sessionId);
  }

  async setPresenceEntry(
    sessionId: string,
    userId: string,
    entry: PresenceEntryRecord
  ) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = new Map();
      this.sessions.set(sessionId, session);
    }
    session.set(userId, structuredClone(entry));
  }

  async getPresenceEntry(
    sessionId: string,
    userId: string
  ): Promise<PresenceEntryRecord | null> {
    const entry = this.sessions.get(sessionId)?.get(userId);
    return entry ? structuredClone(entry) : null;
  }

  async getAllPresenceEntries(
    sessionId: string
  ): Promise<Map<string, PresenceEntryRecord>> {
    const session = this.sessions.get(sessionId);
    const entries = new Map<string, PresenceEntryRecord>();
    if (!session) return entries;

    for (const [userId, entry] of session) {
      entries.set(userId, structuredClone(entry));
    }
    return entries;
  }

  async deletePresenceEntry(sessionId: string, userId: string) {
    this.sessions.get(sessionId)?.delete(userId);
  }

  async deleteSessionPresenceHash(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  async setSocketContext(socketId: string, context: SocketContextRecord) {
    this.sockets.set(socketId, { ...context });
  }

  async getSocketContext(
    socketId: string
  ): Promise<SocketContextRecord | null> {
    const context = this.sockets.get(socketId);
    return context ? { ...context } : null;
  }

  async deleteSocketContext(socketId: string) {
    this.sockets.delete(socketId);
  }

  async clearSessionPresenceState(sessionId: string) {
    const entries = await this.getAllPresenceEntries(sessionId);
    for (const entry of entries.values()) {
      for (const socketId of entry.socketIds) {
        this.sockets.delete(socketId);
      }
    }
    this.sessions.delete(sessionId);
    this.roomMarkers.delete(sessionId);
  }

  reset() {
    this.roomMarkers.clear();
    this.sessions.clear();
    this.sockets.clear();
  }
}
