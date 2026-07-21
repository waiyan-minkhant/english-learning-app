import {
  ArchBox,
  CodeBlock,
  FlowDiagram,
  ModuleGrid
} from "@/components/architecture";
import { SectionHeading, SubSectionHeading } from "./section-heading";

const apiModules = [
  {
    name: "Auth",
    path: "modules/auth/",
    responsibility:
      "Login, JWT verification. Users store display name. HTTP routes set httpOnly cookies; socket middleware reads the same cookie on connection."
  },
  {
    name: "Session",
    path: "modules/session/",
    responsibility:
      "REST start/join for teachers and students. Socket handlers for join_session (acked with participant controls), leave_session, and end_session. Owns DB session records, isSessionLive checks, and coordinates termination."
  },
  {
    name: "Session / Participant controls",
    path: "modules/session/services/participant-controls.service.ts",
    responsibility:
      "Redis map of per-user microphoneEnabled / cursorEnabled. Created on socket join via ensure (student mic may seed from dashboard preference); teacher-only updates for the student; clear on end. canUseCursor / canUseMicrophone gate cursor relay and client media."
  },
  {
    name: "Realtime / Presence",
    path: "modules/realtime/",
    responsibility:
      "Redis-backed presence per room (email, name, role, status, socketIds). Disconnect/reconnect timers, teacher_offline and auto-end scheduling. Emits presence_updated and participant events."
  },
  {
    name: "Realtime / Connection",
    path: "modules/realtime/services/connection.service.ts",
    responsibility:
      "Infra abstraction for socket-to-room binding. Stores connection:socket:{socketId} in Redis with TTL; used by presence (join/leave/disconnect) and cursor (room guard + live-session validation)."
  },
  {
    name: "Realtime / Cursor",
    path: "modules/realtime/services/cursor.service.ts",
    responsibility:
      "Validates normalized cursor payloads via connection.service, checks isSessionLive and canUseCursor before relay, emits cursor_moved to peers (sender excluded)."
  },
  {
    name: "Video",
    path: "modules/video/",
    responsibility:
      "POST /video/token — verifies auth, validates room name, mints LiveKit JWT with publish/subscribe grants."
  },
  {
    name: "Gateway",
    path: "modules/realtime/realtime.gateway.ts",
    responsibility:
      "Thin wrapper around the Socket.IO server for emitToRoom, disconnectRoom, and emitSocketError — avoids circular imports from services."
  }
];

export function BackendPanel() {
  return (
    <div>
      <section className="mb-14">
        <SectionHeading>High-level overview</SectionHeading>
        <p className="mb-6 text-sm leading-6 text-slate-600">
          The API is the source of truth for auth, session records, and realtime
          orchestration. Redis holds ephemeral presence, connection mappings, and
          participant controls; Postgres holds durable user, class, and
          live-session state. Two cleanup layers protect against stale Redis:
          sliding TTL on all realtime keys, and Postgres{" "}
          <code>LiveSession.status</code> checks on join and cursor actions.
        </p>
        <div className="grid gap-3 lg:grid-cols-3">
          <ArchBox
            title="Inbound"
            accent="brand"
            items={[
              "REST routes (auth, session, video)",
              "Socket.IO (session, cursor, controls)",
              "Cookie JWT middleware"
            ]}
          />
          <ArchBox
            title="Services"
            accent="slate"
            items={[
              "session.service (DB + sockets)",
              "participant-controls.service",
              "presence.service (Redis roster)",
              "connection + cursor (relay guards)"
            ]}
          />
          <ArchBox
            title="Stores"
            accent="emerald"
            items={[
              "PostgreSQL via Prisma",
              "Redis state + pub/sub adapter",
              "Process-local reconnect timers"
            ]}
          />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-12">
        <SectionHeading>Application architecture</SectionHeading>
        <p className="mb-8 text-sm leading-6 text-slate-600">
          Code-level layout, event contracts, Redis key design, and the patterns
          used to keep modules testable.
        </p>
      </section>

      <section className="mb-12">
        <SubSectionHeading>API module layout</SubSectionHeading>
        <ModuleGrid modules={apiModules} />
      </section>

      <section className="prose-docs mb-12">
        <h3>Shared contracts pattern</h3>
        <p>
          Payload shapes are defined once in <code>packages/contracts</code> as
          Zod schemas. The frontend imports types inferred from those schemas;
          the API calls <code>.safeParse()</code> on incoming REST bodies and
          socket payloads before executing business logic.
        </p>
        <CodeBlock title="Data flow">
{`Zod schema (contracts)
    ↓
Frontend infers TS types → sends payload
    ↓
API validates at runtime → service executes
    ↓
Response / socket event (also schema-checked where applicable)`}
        </CodeBlock>
        <p>
          Module-level validators (role checks, session invariants, teacher-only
          actions) live in services — contracts handle shape, services handle
          permission and state rules.
        </p>
      </section>

      <section className="mb-12 grid gap-6 lg:grid-cols-2">
        <FlowDiagram
          title="Session start (teacher)"
          steps={[
            {
              label: "POST /sessions/start",
              detail:
                "requireRole(teacher) — finds teacher's Class"
            },
            {
              label: "Create LiveSession",
              detail: "roomId = class-{uuid8}, status = live, startedAt = now"
            },
            {
              label: "initializePresenceRoom(roomId)",
              detail: "Sets Redis room marker session:{sessionId} with TTL"
            },
            {
              label: "Return { roomId }",
              detail:
                "Frontend navigates to /call/{roomId}; controls created later on socket join"
            }
          ]}
        />
        <FlowDiagram
          title="Student join"
          steps={[
            {
              label: "POST /sessions/join",
              detail: "requireRole(student) — finds student's Class enrollment"
            },
            {
              label: "Find live LiveSession",
              detail: "Most recent session with status live for that class"
            },
            {
              label: "Return session metadata",
              detail: "roomId, status, timestamps — frontend opens call page"
            },
            {
              label: "Socket join_session (acked)",
              detail:
                "Presence join + ensureParticipantControlsForUser (optional student mic pref on first create) + broadcast; ack { roomId, participantControls }"
            },
            {
              label: "POST /video/token",
              detail: "LiveKit room token for WebRTC"
            }
          ]}
        />
      </section>

      <section className="prose-docs mb-12">
        <h3>Socket.IO events</h3>
        <p>
          Event names are constants in{" "}
          <code>packages/contracts/socket/events.ts</code>. Rooms use the session{" "}
          <code>roomId</code> as the Socket.IO room name.{" "}
          <code>join_session</code> is acknowledged with the controls snapshot.
        </p>
        <div className="not-prose grid gap-4 sm:grid-cols-2">
          <CodeBlock title="Client → server">
{`join_session                      { sessionId, microphoneEnabled? } (acked)
leave_session                     sessionId
end_session                       sessionId (teacher only)
move_cursor                       { sessionId, x, y }
update_participant_controls       { sessionId, userId, mic?, cursor? }`}
          </CodeBlock>
          <CodeBlock title="Server → client">
{`presence_updated             { sessionId, participants[] }
participant_left             { sessionId, userId }
participant_disconnected     { sessionId, userId }
teacher_offline              { sessionId, userId }
session_ended                { sessionId }
cursor_moved                 { sessionId, userId, x, y }
participant_controls_updated { sessionId, participantControls }
socket_error                 { request, code, message }

join_session ack → { roomId, participantControls }`}
          </CodeBlock>
        </div>
      </section>

      <section className="prose-docs mb-12">
        <h3>Redis realtime state</h3>
        <p>
          Connection, presence, and participant controls use separate Redis
          namespaces. Connection state is infra (socket-to-room mapping);
          presence is the participant roster; controls are teacher-owned
          permission flags. Services talk to <code>connection.service</code>,{" "}
          <code>presence.state</code>, and{" "}
          <code>participant-controls.state</code> — cursor never imports presence
          for socket lookup.
        </p>
        <p>
          All realtime keys use sliding TTL via{" "}
          <code>REDIS_REALTIME_TTL_SECONDS</code> (default 2 hours). On join,
          Redis is checked first; Postgres <code>LiveSession.status</code> is
          validated via <code>isSessionLive</code>. Stale Redis after an ended
          session triggers self-heal (<code>clearPresenceRoom</code>) and a{" "}
          <code>socket_error</code> with <code>SESSION_NOT_LIVE</code>.
        </p>
        <CodeBlock title="Key patterns">
{`connection:socket:{socketId}     → { roomId, userId }  (TTL on bind)

session:{sessionId}              → "1" (room exists marker, TTL)
session:{sessionId}:presence     → hash { userId → JSON entry }

participant:controls:{sessionId} → hash { userId → { microphoneEnabled, cursorEnabled } }

Presence entry: { email, name, role, status, socketIds[] }
Status: online | reconnecting | offline
Defaults: teacher mic+cursor on; student mic on, cursor off`}
        </CodeBlock>
        <CodeBlock title="socket_error payload">
{`{
  "request": "join_session",
  "code": "SESSION_NOT_LIVE",
  "message": "The class has already ended."
}`}
        </CodeBlock>
      </section>

      <section className="mb-12 grid gap-6 lg:grid-cols-2">
        <FlowDiagram
          title="Disconnect & reconnect"
          steps={[
            {
              label: "Socket disconnect",
              detail:
                "Status → reconnecting; start REALTIME_DISCONNECT_TIMEOUT_MS timer"
            },
            {
              label: "Timer fires",
              detail:
                "Status → offline; emit participant_disconnected + presence_updated"
            },
            {
              label: "Teacher disconnect",
              detail:
                "Additionally emit teacher_offline; schedule TEACHER_AUTO_END_SESSION_MS"
            },
            {
              label: "Reconnect before timeout",
              detail: "Clear timer; status → online; refresh presence_updated"
            },
            {
              label: "Teacher auto-end",
              detail:
                "Dynamic import autoEndSession → end DB session → terminateSession (clears presence + controls)"
            }
          ]}
        />
        <FlowDiagram
          title="LiveKit token flow"
          steps={[
            {
              label: "User opens /call/{roomId}",
              detail: "GET /auth/me confirms session cookie"
            },
            {
              label: "POST /video/token",
              detail: "Body: { roomName } — validated by shared Zod contract"
            },
            {
              label: "createVideoToken()",
              detail: "identity = user.id, grants roomJoin + publish + subscribe"
            },
            {
              label: "Return { token, url, roomName }",
              detail: "Frontend connects LiveKit client to wss://…livekit.cloud"
            }
          ]}
        />
      </section>

      <section className="prose-docs mb-12">
        <h3>PostgreSQL schema</h3>
        <p>Core entities and relationships:</p>
        <ul>
          <li>
            <strong>User</strong> — email, name, passwordHash, role (teacher |
            student)
          </li>
          <li>
            <strong>Class</strong> — links one teacher, a lessonId, and one
            student via <strong>ClassStudent</strong>
          </li>
          <li>
            <strong>ClassStudent</strong> — enrollment link (classId, studentId)
          </li>
          <li>
            <strong>LiveSession</strong> — unique roomId, status (scheduled |
            live | ended), timestamps, belongs to Class
          </li>
        </ul>
      </section>

      <section className="prose-docs">
        <h3>Design decisions</h3>
        <h4>Circular dependency avoidance</h4>
        <p>
          <code>session.service</code> imports presence helpers statically, but
          presence needs <code>autoEndSession</code> from session when the teacher
          times out. That import uses dynamic <code>import()</code> inside the
          timer callback to break the static cycle at load time.
        </p>
        <h4>Participant control defaults</h4>
        <p>
          Teachers always have microphone and cursor enabled. The student
          defaults to microphone on and cursor off so the teacher can open
          canvas collaboration intentionally. An in-memory store mirrors Redis
          for Vitest without Docker.
        </p>
        <h4>Normalized cursor coordinates</h4>
        <p>
          Cursors use [0, 1] relative to the canvas bounding rect so peers stay
          aligned when viewport or sidebar size differs. The server relays only
          when <code>canUseCursor</code> allows; it does not store cursor history.
        </p>
        <h4>Gateway indirection</h4>
        <p>
          <code>realtime.gateway.ts</code> holds the Socket.IO server reference
          after <code>initializeRealtime(io)</code>. Services call{" "}
          <code>emitToRoom</code> and <code>emitSocketError</code> without
          importing the full socket bootstrap, keeping modules testable with mocks.
        </p>
        <h4>Testing strategy</h4>
        <p>
          Service unit tests mock Prisma, Redis state (in-memory stores), and the
          gateway. Vitest fake timers exercise disconnect and teacher auto-end
          paths without waiting real seconds. See{" "}
          <code>unit_tests_doc.md</code> in the repo root for full coverage
          notes.
        </p>
      </section>
    </div>
  );
}
