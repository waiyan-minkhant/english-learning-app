import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { inputVariants } from "./inputVariants";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ size, error, className }))}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
