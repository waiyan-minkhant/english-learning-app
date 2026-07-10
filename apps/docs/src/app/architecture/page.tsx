import type { Metadata } from "next";
import { ArchitectureTabs } from "@/components/architecture-tabs";
import { PageHeader } from "@/components/page-header";
import { BackendPanel } from "./backend-panel";
import { FrontendPanel } from "./frontend-panel";
import { OverviewPanel } from "./overview-panel";

export const metadata: Metadata = {
  title: "Architecture"
};

export default function ArchitecturePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Platform design"
        title="Architecture"
        description="How the frontend and backend fit together at a high level, plus detailed walkthroughs of each application's structure, data flows, and realtime patterns."
      />

      <ArchitectureTabs
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: <OverviewPanel />
          },
          {
            id: "frontend",
            label: "Frontend",
            content: <FrontendPanel />
          },
          {
            id: "backend",
            label: "Backend",
            content: <BackendPanel />
          }
        ]}
      />
    </div>
  );
}
