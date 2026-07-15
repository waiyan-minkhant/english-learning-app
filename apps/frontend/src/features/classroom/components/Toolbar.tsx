"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useUiStore } from "@/features/ui/store/uiStore";
import { cn } from "@/utils/cn";

export function Toolbar() {
  const sidebarOpen = useUiStore((state) => state.classroomSidebarOpen);
  const toggleClassroomSidebar = useUiStore(
    (state) => state.toggleClassroomSidebar
  );

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        "absolute right-0 top-1/2 z-30 h-9 w-9 -translate-y-1/2 translate-x-1/2 rounded-pill shadow-md transition-transform duration-200 ease-in-out",
        !sidebarOpen && "hover:translate-x-0 focus-visible:translate-x-0"
      )}
      onClick={toggleClassroomSidebar}
      aria-label={sidebarOpen ? "Hide video panel" : "Show video panel"}
      aria-expanded={sidebarOpen}
    >
      {sidebarOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
    </Button>
  );
}
