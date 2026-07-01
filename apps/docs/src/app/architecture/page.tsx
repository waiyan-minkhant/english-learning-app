import type { Metadata } from "next";
import {
  ArchBox,
  CodeBlock,
  FlowDiagram,
  ModuleGrid
} from "@/components/architecture";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Architecture"
};

const apiModules = [
  {
    name: "Auth",
    path: "modules/auth/",
    responsibility:
      "Register, login, JWT verification. HTTP routes set httpOnly cookies; socket middleware reads the same cookie on connection."
  },
  {
    name: "Session",
    path: "modules/session/",
    responsibility:
      "REST start/join for teachers and students. Socket handlers for join_session, leave_session, and end_session. Owns DB session records and coordinates termination."
  },
  {
    name: "Realtime / Presence",
    path: "modules/realtime/",
    responsibility:
      "Redis-backed presence per room, disconnect/reconnect timers, teacher_offline and auto-end scheduling. Emits presence_updated and participant events."
  },
  {
    name: "Realtime / Cursor",
    path: "modules/realtime/services/cursor.service.ts",
    responsibility:
      "Validates normalized cursor payloads and relays cursor_moved to peers in the same Socket.IO room (sender excluded)."
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
      "Thin wrapper around the Socket.IO server instance for emitToRoom and disconnectRoom — avoids circular imports from services."
  }
];

export default function ArchitecturePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Backend design"
        title="Architecture"
        description="How the API is structured, how data flows between PostgreSQL, Redis, Socket.IO, and LiveKit, and the patterns used to keep the system maintainable."
      />

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          High-level system
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <ArchBox
            title="Clients"
            accent="brand"
            items={[
              "Next.js frontend",
              "REST (fetch + cookies)",
              "Socket.IO (realtime)",
              "LiveKit SDK (WebRTC)"
            ]}
          />
          <ArchBox
            title="API server"
            accent="slate"
            items={[
              "Express 5 :4000",
              "Socket.IO + Redis adapter",
              "Prisma → PostgreSQL",
              "Presence → Redis hashes"
            ]}
          />
          <ArchBox
            title="External"
            accent="emerald"
            items={[
              "LiveKit Cloud (media)",
              "PostgreSQL (persistence)",
              "Redis (presence + pub/sub)"
            ]}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Browsers talk to the API for auth, session setup, and realtime events.
          Audio/video never passes through the API — only short-lived LiveKit
          tokens do.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          API module layout
        </h2>
        <ModuleGrid modules={apiModules} />
      </section>

      <section className="prose-docs mb-12">
        <h2>Shared contracts pattern</h2>
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
              detail: "requireRole(teacher) — finds teacher's Class in Postgres"
            },
            {
              label: "Create LiveSession",
              detail: "roomId = class-{uuid8}, status = live, startedAt = now"
            },
            {
              label: "initializePresenceRoom(roomId)",
              detail: "Sets Redis room marker presence:room:{sessionId}"
            },
            {
              label: "Return { roomId }",
              detail: "Frontend navigates to /call/{roomId}"
            },
            {
              label: "Socket join_session",
              detail: "Client connects with cookie; joinPresence adds user to Redis hash"
            }
          ]}
        />
        <FlowDiagram
          title="Student join"
          steps={[
            {
              label: "POST /sessions/join",
              detail: "requireRole(student) — finds student's Class"
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
              label: "Socket join_session + video token",
              detail: "Presence join + POST /video/token for LiveKit room"
            }
          ]}
        />
      </section>

      <section className="prose-docs mb-12">
        <h2>Socket.IO events</h2>
        <p>
          Event names are constants in <code>packages/contracts/socket/events.ts</code>.
          Rooms use the session <code>roomId</code> as the Socket.IO room name.
        </p>
        <div className="not-prose grid gap-4 sm:grid-cols-2">
          <CodeBlock title="Client → server">
{`join_session    sessionId (string)
leave_session   sessionId
end_session     sessionId (teacher only)
move_cursor     { sessionId, x, y }`}
          </CodeBlock>
          <CodeBlock title="Server → client">
{`presence_updated        { sessionId, participants[] }
participant_left        { sessionId, userId }
participant_disconnected { sessionId, userId }
teacher_offline         { sessionId, userId }
session_ended           { sessionId }
cursor_moved            { sessionId, userId, x, y }`}
          </CodeBlock>
        </div>
      </section>

      <section className="prose-docs mb-12">
        <h2>Redis presence model</h2>
        <p>
          Presence is stored in Redis hashes so multiple API instances can share
          state via the Socket.IO Redis adapter. Reconnect and teacher auto-end
          timers remain in-process (documented limitation for horizontal scale).
        </p>
        <CodeBlock title="Key patterns">
{`presence:room:{sessionId}     → "1" (room exists marker)
presence:session:{sessionId}  → hash { userId → JSON entry }
presence:socket               → hash { socketId → { sessionId, userId } }

Entry: { email, role, status, socketIds[] }
Status: online | reconnecting | offline`}
        </CodeBlock>
      </section>

      <section className="mb-12 grid gap-6 lg:grid-cols-2">
        <FlowDiagram
          title="Disconnect & reconnect"
          steps={[
            {
              label: "Socket disconnect",
              detail: "Status → reconnecting; start REALTIME_DISCONNECT_TIMEOUT_MS timer"
            },
            {
              label: "Timer fires",
              detail: "Status → offline; emit participant_disconnected + presence_updated"
            },
            {
              label: "Teacher disconnect",
              detail: "Additionally emit teacher_offline; schedule TEACHER_AUTO_END_SESSION_MS"
            },
            {
              label: "Reconnect before timeout",
              detail: "Clear timer; status → online; refresh presence_updated"
            },
            {
              label: "Teacher auto-end",
              detail: "Dynamic import autoEndSession → end DB session → terminateSession"
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
        <h2>PostgreSQL schema</h2>
        <p>Core entities and relationships:</p>
        <ul>
          <li>
            <strong>User</strong> — email, passwordHash, role (teacher |
            student)
          </li>
          <li>
            <strong>Class</strong> — links one teacher, one student, and a
            lessonId (lesson content not yet built)
          </li>
          <li>
            <strong>LiveSession</strong> — unique roomId, status (scheduled |
            live | ended), timestamps, belongs to Class
          </li>
        </ul>
      </section>

      <section className="prose-docs">
        <h2>Design decisions</h2>
        <h3>Circular dependency avoidance</h3>
        <p>
          <code>session.service</code> imports presence helpers statically, but
          presence needs <code>autoEndSession</code> from session when the teacher
          times out. That import uses dynamic <code>import()</code> inside the
          timer callback to break the static cycle at load time.
        </p>
        <h3>Normalized cursor coordinates</h3>
        <p>
          Cursors use [0, 1] relative to the canvas bounding rect so peers stay
          aligned when viewport or sidebar size differs. The server relays only;
          it does not store cursor history.
        </p>
        <h3>Gateway indirection</h3>
        <p>
          <code>realtime.gateway.ts</code> holds the Socket.IO server reference
          after <code>initializeRealtime(io)</code>. Services call{" "}
          <code>emitToRoom</code> without importing the full socket bootstrap,
          keeping modules testable with mocks.
        </p>
        <h3>Testing strategy</h3>
        <p>
          Service unit tests mock Prisma, Redis presence store, and the gateway.
          Vitest fake timers exercise disconnect and teacher auto-end paths
          without waiting real seconds.
        </p>
      </section>
    </div>
  );
}
