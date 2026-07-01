import type { Metadata } from "next";
import { FeatureCard } from "@/components/feature-card";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Features"
};

const currentFeatures = [
  {
    title: "Authentication & roles",
    description:
      "Register, login, and logout with bcrypt password hashing and JWT stored in httpOnly cookies. Users have teacher or student roles enforced on REST and socket handlers.",
    tags: ["REST", "JWT", "Prisma"]
  },
  {
    title: "Class & session management",
    description:
      "Teachers start live sessions tied to their assigned class. Students join the active live session for their class. Sessions are persisted with scheduled, live, and ended statuses.",
    tags: ["PostgreSQL", "REST"]
  },
  {
    title: "Live video (LiveKit)",
    description:
      "Authenticated users receive short-lived LiveKit tokens from POST /video/token. The browser connects directly to LiveKit Cloud for WebRTC audio and video — the API secret never leaves the server.",
    tags: ["LiveKit", "WebRTC"]
  },
  {
    title: "Realtime presence",
    description:
      "Socket.IO tracks who is in a session with online, reconnecting, and offline states. Participants see a live-updating list. Disconnect timers mark users offline before removal; teacher disconnect triggers special handling.",
    tags: ["Socket.IO", "Redis"]
  },
  {
    title: "Teacher offline & auto-end",
    description:
      "When the teacher disconnects, the server emits teacher_offline and starts a countdown. If the teacher does not reconnect within the configured window, the session auto-ends — clearing presence and disconnecting all sockets.",
    tags: ["Timers", "Session lifecycle"]
  },
  {
    title: "Collaborative cursors",
    description:
      "Mouse positions on the lesson canvas are normalized to [0, 1], throttled to ~20 FPS, and relayed via Socket.IO. Remote cursors interpolate smoothly on peers without persisting positions in Redis.",
    tags: ["Socket.IO", "Canvas"]
  },
  {
    title: "Session end (teacher)",
    description:
      "Teachers can end a session over the socket. The server updates the database, broadcasts session_ended, clears Redis presence, and forcibly disconnects all clients in the room.",
    tags: ["Socket.IO", "Gateway"]
  },
  {
    title: "Shared contracts",
    description:
      "Zod schemas in packages/contracts define REST DTOs, socket event names, and payload shapes once. The API validates at runtime; the frontend infers TypeScript types from the same source.",
    tags: ["Zod", "Monorepo"]
  },
  {
    title: "Unit tests (API)",
    description:
      "Vitest suites cover auth, session lifecycle, and presence logic with mocked Prisma, Redis, and gateway dependencies. No Docker services required to run tests.",
    tags: ["Vitest", "41 tests"]
  }
];

const upcomingFeatures = [
  {
    title: "Room access control",
    description:
      "Enforce that only class members can join a session room and receive LiveKit tokens — today any authenticated user who knows a room ID can join."
  },
  {
    title: "Lesson content management",
    description:
      "lessonId is stored on Class records but lesson materials, slides, and structured curriculum are not yet implemented in the UI or API."
  },
  {
    title: "Multi-student classrooms",
    description:
      "The data model is currently one teacher and one student per Class. Group classes with multiple students in a single live session are planned."
  },
  {
    title: "Persistent whiteboard",
    description:
      "Cursor positions are ephemeral. Saving canvas strokes, annotations, and lesson state across sessions is on the roadmap."
  },
  {
    title: "In-call chat",
    description:
      "Text chat alongside video and presence — useful for vocabulary notes and links without interrupting the lesson flow."
  },
  {
    title: "Session recording & playback",
    description:
      "LiveKit egress integration to record lessons and let students review sessions after class ends."
  },
  {
    title: "Horizontal scaling hardening",
    description:
      "Reconnect and teacher auto-end timers are process-local today. Moving timer state to Redis would make multi-instance API deployments fully safe."
  },
  {
    title: "Frontend polish & E2E tests",
    description:
      "The call UI works but needs design consistency. Playwright or similar end-to-end tests and CI deployment pipelines are planned."
  },
  {
    title: "Production deployment",
    description:
      "Hosted demo environment with managed Postgres, Redis, and split frontend/API deploys for interview and stakeholder access."
  }
];

export default function FeaturesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Product"
        title="Features"
        description="What ships today and what is planned next. Current features are production-minded MVPs with clear extension points."
      />

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Currently available
        </h2>
        <p className="mb-6 text-slate-600">
          End-to-end flows you can demo today with seeded accounts.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {currentFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              status="live"
              tags={feature.tags}
            />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-600">
          Coming soon
        </h2>
        <p className="mb-6 text-slate-600">
          Known gaps and intentional deferrals — not blockers for the core
          classroom demo.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {upcomingFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              status="soon"
            />
          ))}
        </div>
      </section>

      <section className="prose-docs mt-14">
        <h2>Demo accounts</h2>
        <p>
          Seeded users (password <code>password123</code> for all):
        </p>
        <ul>
          <li>
            <code>teacher@demo.local</code> — starts sessions
          </li>
          <li>
            <code>student1@demo.local</code> — joins class 1
          </li>
          <li>
            <code>student2@demo.local</code> — joins class 2
          </li>
        </ul>
      </section>
    </div>
  );
}
