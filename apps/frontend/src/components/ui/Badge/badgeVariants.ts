import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-body-12 font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-background text-primary",
        secondary: "border-border bg-muted text-muted-foreground",
        success:
          "border-transparent bg-success/15 text-success-foreground",
        danger: "border-transparent bg-danger/15 text-danger-foreground",
        warning: "border-transparent bg-warning/15 text-warning",
        outline: "border-border bg-surface text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
