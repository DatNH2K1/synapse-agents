"use client";

import React, { useState, useEffect } from "react";

interface AvatarProps {
  seed: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

export default function Avatar({
  seed,
  width = 32,
  height = 32,
  alt = "Avatar",
  className = "",
}: AvatarProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Hash/Initials for Fallback UI
  const initials = (() => {
    const clean = seed.replace(/[-_]/g, " ").trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.slice(0, Math.min(2, clean.length)).toUpperCase();
  })();

  const backgroundColor = (() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 50%, 45%)`; // Sleek, premium HSL color
  })();

  useEffect(() => {
    let active = true;
    const cacheKey = `synapse_avatar_${seed}`;

    async function loadAvatar() {
      try {
        // 1. Check local storage
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          if (active) {
            setSvgContent(cached);
            setLoading(false);
          }
          return;
        }

        // 2. Fetch from Dicebear API
        const url = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(
          seed,
        )}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Dicebear responded with status ${res.status}`);
        }
        const text = await res.text();

        // 3. Cache it
        localStorage.setItem(cacheKey, text);

        if (active) {
          setSvgContent(text);
          setLoading(false);
        }
      } catch (err) {
        console.warn(
          "[Avatar Cache] Failed to load avatar, using fallback:",
          err,
        );
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadAvatar();

    return () => {
      active = false;
    };
  }, [seed]);

  // CSS size styles
  const sizeStyle = {
    width: `${width}px`,
    height: `${height}px`,
  };

  // Render Fallback UI if there's an error
  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-full font-black text-white text-[10px] uppercase select-none ${className}`}
        style={{ ...sizeStyle, backgroundColor }}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  // Render Loading Skeleton/Shimmer State
  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-full bg-slate-800 animate-pulse ${className}`}
        style={sizeStyle}
      />
    );
  }

  // Render cached SVG
  return (
    <div
      className={`inline-block rounded-full overflow-hidden transition-opacity duration-300 ease-in opacity-100 ${className}`}
      style={sizeStyle}
      dangerouslySetInnerHTML={{ __html: svgContent || "" }}
    />
  );
}
