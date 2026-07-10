import Link from "next/link";
import { PageHeader } from "@/components/page-header";

const highlights = [
  {
    title: "Live video classes",
    body: "Teachers and students meet in real time via LiveKit WebRTC, with tokens minted securely on the server."
  },
  {
    title: "Realtime collaboration",
    body: "Socket.IO powers presence, session lifecycle, and shared cursors on the lesson canvas."
  },
  {
    title: "Role-based access",
    body: "Teachers start sessions; students join live classes assigned to them. Auth uses JWT in httpOnly cookies."
  },
  {
    title: "Shared contracts",
    body: "Zod schemas in a workspace package keep REST and socket payloads consistent across client and API."
  }
];

export default function OverviewPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Realtime learning platform"
        title="English Learning App"
        description="A full-stack platform for one-on-one English lessons between teachers and students — combining live video, realtime presence, and collaborative tools in a single classroom experience."
      />

      <section className="mb-12 grid gap-4 sm:grid-cols-2">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
          >
            <h2 className="text-base font-semibold text-slate-900">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="prose-docs">
        <h2>What this project is</h2>
        <p>
          English Learning App is a realtime virtual classroom built for
          structured teacher–student sessions. A teacher is assigned to one or
          more students through <code>Class</code> records in PostgreSQL. When
          the teacher starts a session, a unique room is created and both
          parties enter a call page with video, a shared lesson canvas, and a
          live participant list.
        </p>
        <p>
          The backend owns session state, authentication, presence tracking,
          and LiveKit token issuance. The frontend consumes REST for
          session setup and Socket.IO for everything that must update in
          realtime. Media (audio/video) flows directly between browsers and
          LiveKit Cloud — the API never proxies WebRTC traffic.
        </p>

        <h2>Project scope</h2>
        <p>The monorepo covers four deployable surfaces:</p>
        <ul>
          <li>
            <strong>API</strong> — Express 5 server with REST routes, Socket.IO,
            Prisma ORM, and Redis-backed realtime state
          </li>
          <li>
            <strong>Frontend</strong> — Next.js 15 app for login, dashboard, and
            the live call room (video + canvas + presence panel)
          </li>
          <li>
            <strong>Docs</strong> — This documentation site
          </li>
          <li>
            <strong>Contracts</strong> — Shared Zod schemas and socket event
            definitions consumed by both API and frontend
          </li>
        </ul>
        <p>
          Local development uses Docker Compose for PostgreSQL and Redis. LiveKit
          runs on LiveKit Cloud. Database seeds provide demo teacher and student
          accounts for quick testing.
        </p>

        <h2>Who it is for</h2>
        <ul>
          <li>
            <strong>Teachers</strong> — start a live class, share video, see who
            is online, end the session, and recover gracefully when connectivity
            drops
          </li>
          <li>
            <strong>Students</strong> — join the teacher&apos;s active session,
            participate in video, and collaborate on the lesson canvas
          </li>
        </ul>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-elevated">
        <h2 className="text-xl font-semibold">Explore the docs</h2>
        <p className="mt-2 max-w-xl text-brand-100">
          Dive into shipped features, the full tech stack, and platform
          architecture (frontend overview + detailed backend design) — designed
          for interview walkthroughs and onboarding.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <DocLink href="/features">Features</DocLink>
          <DocLink href="/tech-stack">Tech Stack</DocLink>
          <DocLink href="/architecture">Architecture</DocLink>
          <LiveAppLink />
        </div>
      </section>
    </div>
  );
}

function DocLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
    >
      {children}
    </Link>
  );
}

function LiveAppLink() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;

  return (
    <a
      href={appUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
    >
      Open live app
    </a>
  );
}
