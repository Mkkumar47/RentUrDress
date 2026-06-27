import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "primary" | "success" | "warning" | "neutral";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  primary: "border-fuchsia-300/40 bg-fuchsia-400/20 text-fuchsia-100",
  success: "border-emerald-300/40 bg-emerald-400/20 text-emerald-100",
  warning: "border-amber-300/40 bg-amber-400/20 text-amber-100",
  neutral: "border-slate-300/30 bg-slate-400/20 text-slate-100",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium shadow-[0_8px_18px_rgba(15,23,42,0.25)]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
