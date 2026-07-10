import { cva } from "class-variance-authority";

/**
 * Lesson card styles mapped to design tokens:
 * @see apps/frontend/src/design/tokens/colors.ts
 * @see apps/frontend/src/design/tokens/typography.ts
 */

export const lessonCardVariants = cva(
  "relative flex min-h-[140px] flex-col rounded-3xl p-lg transition-colors",
  {
    variants: {
      status: {
        locked: "cursor-not-allowed bg-gradient-to-b from-locked-gradient-from to-locked-gradient-to",
        active:
          "cursor-pointer border-b-4 border-primary bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to shadow-sm"
      }
    },
    defaultVariants: {
      status: "active"
    }
  }
);

export const lessonNumberBadgeVariants = cva(
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-title-24 font-bold",
  {
    variants: {
      status: {
        locked: "bg-surface text-foreground",
        active: "bg-primary text-primary-foreground"
      }
    },
    defaultVariants: {
      status: "active"
    }
  }
);

export const lessonCardTitleVariants = cva("text-title-16 font-bold", {
  variants: {
    status: {
      locked: "text-foreground",
      active: "text-primary"
    }
  },
  defaultVariants: {
    status: "active"
  }
});

export const lessonCardDescriptionVariants = cva(
  "text-body-14 font-normal text-foreground"
);

export const lessonLockedPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill bg-surface px-3 py-1.5 text-body-12 font-medium text-muted-foreground"
);

export const lessonCompleteBadgeVariants = cva(
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-background"
);
