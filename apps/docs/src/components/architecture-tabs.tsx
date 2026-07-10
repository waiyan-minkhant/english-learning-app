"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

export type ArchitectureTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type ArchitectureTabsProps = {
  tabs: ArchitectureTab[];
  defaultTab?: string;
};

export function ArchitectureTabs({ tabs, defaultTab }: ArchitectureTabsProps) {
  const [activeId, setActiveId] = useState(
    () => defaultTab ?? tabs[0]?.id ?? ""
  );

  const selectTab = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && tabs.some((tab) => tab.id === hash)) {
      setActiveId(hash);
    }
  }, [tabs]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && tabs.some((tab) => tab.id === hash)) {
        setActiveId(hash);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [tabs]);

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Architecture sections"
        className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4"
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeId;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => selectTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab ? (
        <div
          role="tabpanel"
          id={`panel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
        >
          {activeTab.content}
        </div>
      ) : null}
    </div>
  );
}
