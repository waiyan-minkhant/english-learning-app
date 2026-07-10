import { cva } from "class-variance-authority";

export const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-brand-background font-medium text-primary",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-body-12",
        md: "h-10 w-10 text-body-14",
        lg: "h-12 w-12 text-body-16"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);
