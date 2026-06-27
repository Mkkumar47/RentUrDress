import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 shadow-[0_8px_20px_rgba(2,6,23,0.35)] outline-none transition placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35",
        className,
      )}
      {...props}
    />
  );
}
