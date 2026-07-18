import { ArchBox, CodeBlock } from "@/components/architecture";
import { SectionHeading } from "./section-heading";

export function OverviewPanel() {
  return (
    <section>
      <SectionHeading>Platform overview</SectionHeading>
      <p className="mb-6 text-sm leading-6 text-slate-600">
        The monorepo ships a Next.js client, an Express API, shared Zod
        contracts, and this docs site. Browsers authenticate via REST, join
        sessions over Socket.IO, and stream media directly to LiveKit Cloud —
        the API never proxies WebRTC.
      </p>
      <div className="mb-8 grid gap-3 lg:grid-cols-4">
        <ArchBox
          title="Frontend"
          accent="brand"
          items={[
            "Next.js 15 (App Router)",
            "TanStack Query + Zustand",
            "Socket.IO client",
            "LiveKit client"
          ]}
        />
        <ArchBox
          title="API"
          accent="slate"
          items={[
            "Express 5 :4000",
            "Socket.IO + Redis adapter",
            "Prisma → PostgreSQL",
            "Presence + controls + connections"
          ]}
        />
        <ArchBox
          title="Data"
          accent="emerald"
          items={[
            "PostgreSQL (users, classes, sessions)",
            "Redis (presence, controls, connections)",
            "LiveKit Cloud (media rooms)"
          ]}
        />
        <ArchBox
          title="Shared"
          accent="amber"
          items={[
            "packages/contracts (Zod)",
            "Socket event constants",
            "REST + socket payload schemas"
          ]}
        />
      </div>

      <SectionHeading>Monorepo data flow</SectionHeading>
      <p className="mb-4 text-sm leading-6 text-slate-600">
        REST handles auth, session setup, and LiveKit token minting. Socket.IO
        carries presence, participant controls, session lifecycle, and cursor
        relay. Media flows browser-to-LiveKit; the API validates permissions but
        never proxies WebRTC.
      </p>
      <CodeBlock title="End-to-end classroom path">
{`Browser (apps/frontend)
  → REST: login, start/join session, video token
  → Socket.IO: join_session (ack controls), presence, cursors, participant controls
  → LiveKit: WebRTC audio/video (direct to cloud)

API (apps/api)
  → Postgres: users (with name), Class (1 teacher + 1 student via ClassStudent), LiveSession
  → Redis: presence roster, participant controls, socket-to-room bindings
  → LiveKit SDK: mint short-lived room tokens

Shared (packages/contracts)
  → Zod schemas + event names consumed by both sides`}
      </CodeBlock>
    </section>
  );
}
