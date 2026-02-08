"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--primary)] text-white shadow-[0_12px_24px_rgba(15,118,110,.18)] hover:brightness-95 focus-visible:ring-[rgba(15,118,110,.25)]",
        secondary:
          "bg-[color:var(--pf-surface-weak)] text-[color:var(--foreground)] hover:bg-[color:var(--pf-surface)] focus-visible:ring-[rgba(16,24,40,.14)]",
        outline:
          "border border-[color:var(--line)] bg-[color:var(--pf-surface-weak)] text-[color:var(--foreground)] hover:border-[rgba(15,118,110,.45)] hover:bg-[color:var(--pf-surface)] hover:shadow-[0_10px_22px_rgba(16,24,40,.12)] focus-visible:ring-[rgba(15,118,110,.2)]",
        danger:
          "bg-[color:var(--danger)] text-white hover:brightness-95 focus-visible:ring-[rgba(180,35,24,.22)]",
        ghost:
          "bg-transparent text-[color:var(--foreground)] hover:bg-[color:var(--pf-surface-weak)] focus-visible:ring-[rgba(16,24,40,.14)]",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
