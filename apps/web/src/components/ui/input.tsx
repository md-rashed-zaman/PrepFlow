"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--pf-input-bg)] px-4 text-sm shadow-[var(--pf-input-shadow)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[rgba(15,118,110,.5)] focus:ring-4 focus:ring-[rgba(15,118,110,.14)]",
        className,
      )}
      {...props}
    />
  );
}
