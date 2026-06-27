"use client";

import { motion } from "framer-motion";

type LoadingSceneProps = {
  title?: string;
  message?: string;
  compact?: boolean;
};

export function LoadingScene({
  title = "Preparing your fashion experience",
  message = "Rendering 3D backdrop, listings, and live tracking...",
  compact = false,
}: LoadingSceneProps) {
  const size = compact ? "h-40" : "h-64";

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-6 backdrop-blur-xl ${size}`}
      role="status"
      aria-live="polite"
    >
      <motion.div
        className="absolute h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="relative flex items-center justify-center">
        <motion.div
          className="h-16 w-16 rounded-full border-2 border-cyan-300/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute h-9 w-9 rounded-full border-2 border-fuchsia-300/70"
          animate={{ rotate: -360, scale: [1, 1.1, 1] }}
          transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </div>

      <div className="relative text-center">
        <p className="text-sm font-semibold tracking-wide text-white">{title}</p>
        <p className="text-xs text-slate-300">{message}</p>
      </div>

      <motion.div
        className="relative h-1 w-40 overflow-hidden rounded-full bg-white/20"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
