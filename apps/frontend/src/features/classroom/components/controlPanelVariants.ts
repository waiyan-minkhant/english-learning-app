import { cva } from "class-variance-authority";

/**
 * Control panel styles mapped to design tokens:
 * @see apps/frontend/src/design/tokens/colors.ts
 * @see apps/frontend/src/design/tokens/typography.ts
 */

export const controlPanelShellVariants = cva(
  "shrink-0 overflow-hidden rounded-3xl border border-border bg-surface"
);

export const controlPanelCellVariants = cva(
  "flex flex-col items-center justify-center px-md py-md transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      interactive: {
        true: "hover:bg-muted/40",
        false: ""
      }
    },
    defaultVariants: {
      interactive: false
    }
  }
);

export const controlPanelCircleVariants = cva(
  "flex h-12 w-12 items-center justify-center rounded-full",
  {
    variants: {
      tone: {
        primary: "bg-primary text-primary-foreground",
        muted: "bg-muted text-icon"
      }
    },
    defaultVariants: {
      tone: "muted"
    }
  }
);
