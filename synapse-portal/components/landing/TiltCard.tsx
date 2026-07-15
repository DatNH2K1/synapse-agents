"use client";

import React, { useRef, useCallback } from "react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees
  style?: React.CSSProperties;
  disableTilt?: boolean;
}

/**
 * A wrapper that applies a real-time 3D tilt transform based on mouse position.
 * Uses direct DOM mutation (no state) for maximum performance.
 */
export default function TiltCard({
  children,
  className = "",
  maxTilt = 10,
  style,
  disableTilt = false,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;

      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();

        if (!disableTilt) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) / (rect.width / 2);
          const dy = (e.clientY - cy) / (rect.height / 2);

          const rx = -dy * maxTilt; // rotate around X axis (up/down)
          const ry = dx * maxTilt; // rotate around Y axis (left/right)

          el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.025, 1.025, 1.025)`;
        }

        el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    },
    [maxTilt, disableTilt],
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (!disableTilt) {
      el.style.transform = "";
    }
  }, [disableTilt]);

  return (
    <div
      ref={ref}
      style={style}
      className={`${!disableTilt ? "card-tilt" : ""} spotlight-card press-tactile cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}
