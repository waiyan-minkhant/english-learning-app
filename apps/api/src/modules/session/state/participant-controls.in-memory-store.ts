import type { ParticipantControls } from "@english-learning/contracts/socket/schema";
import {
  STUDENT_PARTICIPANT_CONTROLS,
  TEACHER_PARTICIPANT_CONTROLS
} from "./participant-controls.state.js";

export class InMemoryParticipantControlsStore {
  private sessions = new Map<string, Map<string, ParticipantControls>>();

  async initializeParticipantControls(
    sessionId: string,
    entries: Record<string, ParticipantControls>
  ) {
    const session = new Map<string, ParticipantControls>();
    for (const [userId, controls] of Object.entries(entries)) {
      session.set(userId, structuredClone(controls));
    }
    this.sessions.set(sessionId, session);
  }

  async getParticipantControls(
    sessionId: string,
    userId: string
  ): Promise<ParticipantControls | null> {
    const controls = this.sessions.get(sessionId)?.get(userId);
    return controls ? structuredClone(controls) : null;
  }

  async getAllParticipantControls(
    sessionId: string
  ): Promise<Record<string, ParticipantControls>> {
    const session = this.sessions.get(sessionId);
    const controls: Record<string, ParticipantControls> = {};
    if (!session) return controls;

    for (const [userId, value] of session) {
      controls[userId] = structuredClone(value);
    }
    return controls;
  }

  async setParticipantControls(
    sessionId: string,
    userId: string,
    controls: ParticipantControls
  ) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = new Map();
      this.sessions.set(sessionId, session);
    }
    session.set(userId, structuredClone(controls));
  }

  async updateParticipantControls(
    sessionId: string,
    userId: string,
    patch: Partial<ParticipantControls>
  ): Promise<ParticipantControls> {
    const current =
      (await this.getParticipantControls(sessionId, userId)) ??
      STUDENT_PARTICIPANT_CONTROLS;
    const next = { ...current, ...patch };
    await this.setParticipantControls(sessionId, userId, next);
    return next;
  }

  async updateBulkStudentControls(
    sessionId: string,
    teacherUserId: string,
    patch: Partial<ParticipantControls>
  ) {
    const all = await this.getAllParticipantControls(sessionId);
    for (const [userId, controls] of Object.entries(all)) {
      if (userId === teacherUserId) continue;
      await this.setParticipantControls(sessionId, userId, {
        ...controls,
        ...patch
      });
    }
  }

  async ensureParticipantControls(
    sessionId: string,
    userId: string,
    role: "teacher" | "student"
  ) {
    const existing = await this.getParticipantControls(sessionId, userId);
    if (existing) return existing;

    const defaults =
      role === "teacher"
        ? TEACHER_PARTICIPANT_CONTROLS
        : STUDENT_PARTICIPANT_CONTROLS;
    await this.setParticipantControls(sessionId, userId, defaults);
    return defaults;
  }

  async clearParticipantControls(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  reset() {
    this.sessions.clear();
  }
}
