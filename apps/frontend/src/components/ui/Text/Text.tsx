import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { textVariants } from "./textVariants";

type TextElement = "p" | "span" | "h1" | "h2" | "h3" | "label" | "div";

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: TextElement;
  htmlFor?: string;
}

const defaultElement: Record<
  NonNullable<VariantProps<typeof textVariants>["variant"]>,
  TextElement
> = {
  heading: "h2",
  title: "h3",
  body: "p",
  caption: "span",
  label: "label"
};

const defaultTone: Partial<
  Record<NonNullable<VariantProps<typeof textVariants>["variant"]>, VariantProps<typeof textVariants>["tone"]>
> = {
  heading: "default",
  title: "default",
  label: "default",
  body: "muted",
  caption: "muted"
};

export function Text({
  as,
  className,
  variant,
  size,
  weight,
  tone,
  ...props
}: TextProps) {
  const Component = as ?? defaultElement[variant ?? "body"];
  const resolvedTone = tone ?? defaultTone[variant ?? "body"] ?? "muted";

  return (
    <Component
      className={cn(textVariants({ variant, size, weight, tone: resolvedTone, className }))}
      {...props}
    />
  );
}
