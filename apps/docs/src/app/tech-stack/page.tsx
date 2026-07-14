import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StackGroup } from "@/components/stack-group";

export const metadata: Metadata = {
  title: "Tech Stack"
};

const stackSections = [
  {
    title: "Monorepo & tooling",
    description: "How the repository is organized and built.",
    items: [
      { name: "pnpm workspaces", role: "Package manager & monorepo" },
      { name: "Turborepo", role: "Task orchestration (build, dev, test)" },
      { name: "TypeScript 5", role: "Strict typing across all packages" },
      { name: "ESM modules", role: "Modern import/export in API" }
    ]
  },
  {
    title: "Backend (apps/api)",
    description: "Express API server, realtime, and data layer.",
    items: [
      { name: "Express 5", role: "HTTP server & REST routing" },
      { name: "Socket.IO 4", role: "WebSocket realtime events" },
      { name: "@socket.io/redis-adapter", role: "Multi-instance socket fan-out" },
      { name: "Prisma 6", role: "ORM, migrations, seed scripts" },
      { name: "PostgreSQL 16", role: "Primary relational database" },
      { name: "Redis 7", role: "Presence, participant controls & pub/sub adapter" },
      { name: "jsonwebtoken + bcryptjs", role: "Auth tokens & password hashing" },
      { name: "livekit-server-sdk", role: "Mint WebRTC access tokens" },
      { name: "Zod 4", role: "Runtime payload validation" },
      { name: "Vitest 3", role: "Unit tests for service layer" }
    ]
  },
  {
    title: "Frontend (apps/frontend)",
    description: "Next.js client — feature-first modules, TanStack Query, Zustand, semantic design tokens, and LiveKit/Socket.IO integration.",
    items: [
      { name: "Next.js 15", role: "App Router, SSR/CSR pages" },
      { name: "React 19", role: "UI components & hooks" },
      { name: "TanStack Query", role: "Server/async data (auth, session, video, lesson)" },
      { name: "Zustand", role: "Client & realtime UI state (feature stores, media prefs, controls)" },
      { name: "Tailwind CSS 3", role: "Semantic tokens via design/themes" },
      { name: "socket.io-client", role: "Realtime connection to API" },
      { name: "livekit-client", role: "WebRTC room connection" },
      { name: "Zod", role: "Parse API/socket responses" }
    ]
  },
  {
    title: "Shared (packages/contracts)",
    description: "Single source of truth for cross-boundary types.",
    items: [
      { name: "Zod schemas", role: "Auth (incl. name), class (studentIds), session, video, socket payloads" },
      { name: "Event constants", role: "clientEvents / serverEvents maps" },
      { name: "Workspace package", role: "Imported by API & frontend" }
    ]
  },
  {
    title: "Infrastructure & services",
    description: "External and local dependencies for a full environment.",
    items: [
      { name: "LiveKit Cloud", role: "Managed WebRTC SFU / TURN" },
      { name: "Docker Compose", role: "Local Postgres, Redis, pgAdmin" },
      { name: "PostgreSQL", role: "Users, classes, live sessions" },
      { name: "Redis", role: "Presence hashes, participant controls, socket context, adapter" }
    ]
  },
  {
    title: "Documentation (apps/docs)",
    description: "This site.",
    items: [
      { name: "Next.js 15", role: "Static docs pages" },
      { name: "Tailwind CSS", role: "Layout & typography" }
    ]
  }
];

export default function TechStackPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Engineering"
        title="Tech Stack"
        description="Languages, frameworks, and services that power the platform. The backend is the most mature layer; the frontend is actively being refined."
      />

      <div className="space-y-6">
        {stackSections.map((section) => (
          <StackGroup
            key={section.title}
            title={section.title}
            description={section.description}
            items={section.items}
          />
        ))}
      </div>

      <section className="prose-docs mt-12">
        <h2>Repository layout</h2>
        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5 font-mono text-sm leading-7 text-slate-700 shadow-card">
{`english_learning_app/
├── apps/
│   ├── api/          Express + Socket.IO + Prisma
│   ├── frontend/     Next.js classroom UI
│   └── docs/         Documentation site
├── packages/
│   └── contracts/    Shared Zod schemas & events
├── pnpm-workspace.yaml
└── turbo.json`}
        </pre>

        <h2>Environment variables (API)</h2>
        <p>Key configuration from <code>apps/api/.env.example</code>:</p>
        <ul>
          <li>
            <code>DATABASE_URL</code> — PostgreSQL connection string
          </li>
          <li>
            <code>REDIS_URL</code> — Redis for presence, participant controls,
            and Socket.IO adapter
          </li>
          <li>
            <code>JWT_SECRET</code> — Signs application JWT cookies
          </li>
          <li>
            <code>FRONTEND_URL</code> — CORS and Socket.IO origin
          </li>
          <li>
            <code>LIVEKIT_*</code> — Cloud project URL, API key, and secret
          </li>
          <li>
            <code>REALTIME_DISCONNECT_TIMEOUT_MS</code> — Reconnect grace period
          </li>
          <li>
            <code>TEACHER_AUTO_END_SESSION_MS</code> — Auto-end after teacher offline
          </li>
        </ul>
      </section>
    </div>
  );
}
