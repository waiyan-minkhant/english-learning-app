import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "flex w-full rounded-md border bg-surface text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-9 px-3 text-body-14",
        md: "h-10 px-3 text-body-16"
      },
      error: {
        true: "border-danger focus-visible:ring-danger",
        false: "border-border"
      }
    },
    defaultVariants: {
      size: "md",
      error: false
    }
  }
);
