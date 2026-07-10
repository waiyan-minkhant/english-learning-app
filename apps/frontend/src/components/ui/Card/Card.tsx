import * as React from "react";
import { cn } from "@/utils/cn";
import { cardVariants } from "./cardVariants";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn(cardVariants(), className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div className={cn("border-b border-border px-6 py-4", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-title-16 font-semibold text-foreground", className)}
      {...props}
    />
  );
}
