"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type PointerState = {
  x: number;
  y: number;
};

export function FluidBackgroundOverlay() {
  const [pointer, setPointer] = useState<PointerState>({ x: 50, y: 50 });

  useEffect(() => {
    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setPointer({
          x: (event.clientX / window.innerWidth) * 100,
          y: (event.clientY / window.innerHeight) * 100,
        });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden" aria-hidden>
      <div className="fluid-aurora-layer" />

      <motion.div
        className="fluid-blob fluid-blob-one"
        animate={{
          x: [-140, 90, -80],
          y: [-100, 80, -50],
          scale: [1, 1.28, 0.94, 1],
          rotate: [0, 60, 130, 180],
        }}
        transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="fluid-blob fluid-blob-two"
        animate={{
          x: [110, -120, 95],
          y: [70, -90, 45],
          scale: [1.05, 0.88, 1.2, 1.05],
          rotate: [180, 240, 320, 360],
        }}
        transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="fluid-blob fluid-blob-three"
        animate={{
          x: [0, 140, -120, 0],
          y: [120, -80, 70, 120],
          scale: [0.95, 1.18, 0.9, 0.95],
          rotate: [40, 120, 240, 340],
        }}
        transition={{ duration: 34, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="fluid-lens"
        animate={{ opacity: [0.22, 0.46, 0.22], scale: [0.96, 1.1, 0.96] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <div className="pointer-glow" style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }} />
      <div className="grain-overlay" />
    </div>
  );
}
