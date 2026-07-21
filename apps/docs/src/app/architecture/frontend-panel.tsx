import {
  ArchBox,
  CodeBlock,
  FlowDiagram,
  ModuleGrid
} from "@/components/architecture";
import { SectionHeading, SubSectionHeading } from "./section-heading";

const frontendModules = [
  {
    name: "Auth",
    path: "features/auth/",
    responsibility:
      "Login and logout via useAuth. authStore persists the session user (including display name); RequireAuth and RedirectIfAuthenticated guard routes. Syncs TanStack Query auth/me into Zustand."
  },
  {
    name: "Session",
    path: "features/session/",
    responsibility:
      "useStartSession and useJoinSession mutations call sessionService, then navigate to /call/[roomId]. Thin hooks over REST — no local session store."
  },
  {
    name: "Media",
    path: "features/media/",
    responsibility:
      "MediaPrepPanel on the dashboard requests camera/mic permission, shows a preview, and stores local mute/camera prefs in mediaPreferencesStore. Start/join stay gated until permission is granted."
  },
  {
    name: "Lesson",
    path: "features/lesson/",
    responsibility:
      "Solo and embedded classroom lesson UI: LessonContainer, exercises, sidebar, progress. lessonStore tracks step index and completion; lessonService loads static course.json."
  },
  {
    name: "Classroom",
    path: "features/classroom/",
    responsibility:
      "Live call shell: ClassroomContainer, VideoGrid (LiveKit), ParticipantControlsPopover/Panel, CursorOverlay, Toolbar. Stores: classroomStore, presenceStore, cursorStore, participantControlsStore. ClassroomMediaContext applies prefs + teacher mic locks."
  },
  {
    name: "Realtime",
    path: "features/realtime/",
    responsibility:
      "useRealtimeConnection opens the socket and emitJoinSessionWithAck, then hydrates participant controls. usePresence, useCursor, useParticipantControlsSync, and useTeacherStatus wire server events into classroom stores via lib/socket/."
  },
  {
    name: "UI / Settings",
    path: "features/ui/, features/settings/",
    responsibility:
      "uiStore toggles classroom video sidebar. settingsStore persists theme and language preferences for future dark-mode wiring."
  }
];

export function FrontendPanel() {
  return (
    <div>
      <section className="mb-14">
        <SectionHeading>High-level overview</SectionHeading>
        <p className="mb-6 text-sm leading-6 text-slate-600">
          The frontend is organized feature-first under{" "}
          <code>features/*</code>. Thin App Router pages delegate to containers;
          hooks orchestrate TanStack Query (server/async data) and Zustand
          (client and realtime UI state). Presentation uses a semantic design
          system in <code>components/ui/</code> — feature code composes
          primitives instead of raw Tailwind color utilities.
        </p>
        <div className="mb-8 grid gap-3 lg:grid-cols-3">
          <ArchBox
            title="App shell"
            accent="brand"
            items={[
              "Next.js 15 App Router",
              "Thin pages + containers",
              "QueryProvider (TanStack Query)",
              "Inter + design/globals.css"
            ]}
          />
          <ArchBox
            title="State"
            accent="slate"
            items={[
              "Query: auth, session, video, lesson",
              "Zustand: auth, lesson, classroom",
              "Zustand: presence, cursor, controls, media",
              "Zustand: ui, settings (persisted)"
            ]}
          />
          <ArchBox
            title="Realtime + media"
            accent="emerald"
            items={[
              "lib/socket/ + contracts",
              "Typed emit + Zod listeners",
              "LiveKit client in VideoGrid",
              "Media prep + cursor overlay"
            ]}
          />
        </div>

        <CodeBlock title="Layered data flow">
{`Page (app/*/page.tsx)
  └─ guards: RequireAuth / RedirectIfAuthenticated
  └─ Container (LessonContainer, ClassroomContainer)
       └─ hooks (useAuth, useClassroom, useLessonViewModel, …)
            ├─ TanStack Query → services/* → lib/api-client.ts
            └─ Zustand stores → presentational views
       └─ View (LessonView, ClassroomView) — composes components/ui`}
        </CodeBlock>
      </section>

      <section className="border-t border-slate-200 pt-12">
        <SectionHeading>Application architecture</SectionHeading>
        <p className="mb-8 text-sm leading-6 text-slate-600">
          Feature modules, HTTP services, socket client layout, routes, and the
          design system that keeps styling centralized.
        </p>
      </section>

      <section className="mb-12">
        <SubSectionHeading>Feature module layout</SubSectionHeading>
        <ModuleGrid modules={frontendModules} />
      </section>

      <section className="prose-docs mb-12">
        <h3>Folder structure</h3>
        <CodeBlock title="apps/frontend/src/">
{`app/              App Router pages + root layout
features/         Domain modules (auth, session, media, lesson, classroom, …)
  */hooks/        Business orchestration
  */store/        Zustand client/realtime state
  */components/   Feature-specific UI
components/
  ui/             Design-system primitives (CVA + semantic tokens)
  icons/          Lucide icon wrappers
  common/         QueryProvider
design/
  tokens/         TS token docs (mirror CSS vars)
  themes/         light.css + dark.css
  globals.css     Tailwind entry + theme imports
lib/
  api-client.ts   fetch wrapper (credentials: include)
  socket/         Socket.IO client, emit, listeners
  zustand/        Persist helpers
services/         authService, sessionService, videoService, lessonService`}
        </CodeBlock>
      </section>

      <section className="prose-docs mb-12">
        <h3>Routes</h3>
        <ul>
          <li>
            <strong>/login</strong> — auth form; redirect to dashboard on
            success
          </li>
          <li>
            <strong>/dashboard</strong> — media prep (permission + preview),
            start/join class (gated on permission), lesson links, logout
          </li>
          <li>
            <strong>/lesson/[lessonId]</strong> — solo lesson with sidebar,
            exercises, and persisted progress
          </li>
          <li>
            <strong>/call/[roomId]</strong> — live classroom: embedded lesson,
            video panel, participant controls, collaborative cursors
          </li>
        </ul>
      </section>

      <section className="prose-docs mb-12">
        <h3>HTTP services</h3>
        <p>
          All REST calls go through <code>lib/api-client.ts</code> with cookie
          credentials. Services are thin wrappers consumed by TanStack Query
          hooks:
        </p>
        <ul>
          <li>
            <strong>authService</strong> — login, me, logout
          </li>
          <li>
            <strong>sessionService</strong> — start and join live sessions
          </li>
          <li>
            <strong>videoService</strong> — POST /video/token for LiveKit
          </li>
          <li>
            <strong>lessonService</strong> — loads local course.json (no HTTP yet)
          </li>
        </ul>
      </section>

      <section className="prose-docs mb-12">
        <h3>Design system</h3>
        <p>
          Semantic tokens live in <code>design/themes/light.css</code> (brand
          orange <code>#FF6715</code>, surfaces, typography scale). Tailwind maps
          CSS variables to utilities like <code>bg-primary</code>,{" "}
          <code>text-muted-foreground</code>, and <code>text-title-24</code>.
        </p>
        <p>
          <code>components/ui/*</code> exposes CVA-based primitives (Button,
          Card, Input, Text, Badge, Progress, Avatar, Dialog, Tooltip). Only
          UI and layout components contain Tailwind class strings; features
          compose these primitives.
        </p>
        <p>
          shadcn is kept via <code>components.json</code> as an optional CLI for
          future components (Drawer, Calendar) — it is not a runtime dependency.
          New shadcn additions should be restyled to match semantic tokens before
          use in features.
        </p>
      </section>

      <section className="mb-12 grid gap-6 lg:grid-cols-2">
        <FlowDiagram
          title="Classroom entry"
          steps={[
            {
              label: "Dashboard media prep",
              detail:
                "MediaPrepPanel grants camera/mic; prefs stored in mediaPreferencesStore"
            },
            {
              label: "Dashboard action",
              detail:
                "Teacher: useStartSession → POST /sessions/start. Student: useJoinSession → POST /sessions/join"
            },
            {
              label: "Navigate to /call/{roomId}",
              detail: "ClassroomContainer mounts with roomId from the URL"
            },
            {
              label: "useRealtimeConnection",
              detail:
                "createSocket() → emitJoinSessionWithAck → hydrate participantControlsStore"
            },
            {
              label: "Parallel setup",
              detail:
                "useVideoToken, usePresence, useCursor, useParticipantControlsSync, useTeacherStatus"
            },
            {
              label: "ClassroomView renders",
              detail:
                "LessonContainer, VideoGrid, ParticipantControlsPopover, CursorOverlay; ClassroomMediaProvider applies prefs + mic locks"
            }
          ]}
        />
        <FlowDiagram
          title="Solo lesson flow"
          steps={[
            {
              label: "Open /lesson/{lessonId}",
              detail: "RequireAuth → LessonContainer loads lessonStore for lessonId"
            },
            {
              label: "useLessonViewModel",
              detail:
                "TanStack Query fetches lesson JSON; store tracks stepIndex and completed steps"
            },
            {
              label: "StepRenderer",
              detail:
                "Renders knowledge content or exercise by step kind; quiz gate before next"
            },
            {
              label: "Progress persisted",
              detail:
                "lessonStore writes progressByLessonId to localStorage via createPersist"
            },
            {
              label: "Footer navigation",
              detail: "Back/next driven by view model; Sidebar jumps to outline steps"
            }
          ]}
        />
      </section>

      <section className="prose-docs">
        <h3>Socket client</h3>
        <p>
          <code>lib/socket/</code> centralizes the Socket.IO client. Event names
          and payload schemas come from <code>packages/contracts</code>. Classroom
          hooks never import socket.io directly — they use typed{" "}
          <code>emit.ts</code> helpers and Zod-validated{" "}
          <code>listeners.ts</code> parsers.
        </p>
        <CodeBlock title="lib/socket/ layout">
{`socket.ts     createSocket(), disconnectSocket() — withCredentials to API
events.ts     Re-exports clientEvents / serverEvents from contracts
emit.ts       joinSession, emitJoinSessionWithAck, leaveSession, endSession,
              moveCursor, updateParticipantControls
listeners.ts  parsePresenceUpdated, parseCursorMoved,
              parseParticipantControlsUpdatedPayload, … (Zod safeParse)`}
        </CodeBlock>
      </section>
    </div>
  );
}
