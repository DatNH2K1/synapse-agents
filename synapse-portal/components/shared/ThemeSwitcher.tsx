"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Zap, Cloud, Palette, ChevronUp, Check } from "lucide-react";
import { useIsMounted } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";

const themes = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "midnight", icon: Moon, label: "Midnight" },
  { id: "arctic", icon: Cloud, label: "Arctic" },
  { id: "neon", icon: Zap, label: "Neon" },
];

export default function ThemeSwitcher() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTheme = themes.find((t) => t.id === theme) || themes[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-dashboard-bg/70 border border-white/10 rounded-xl hover:bg-dashboard-bg/85 hover:border-accent-primary/20 transition-all duration-300 group"
      >
        <div className="flex items-center gap-2">
          <Palette size={10} className="text-dashboard-fg/55" />
          <span className="text-[9px] font-black uppercase tracking-widest text-dashboard-fg/55 w-20 text-left">
            {t("theme")}
          </span>
          <currentTheme.icon
            size={12}
            className="text-accent-primary group-hover:text-accent-primary transition-colors"
          />
          <span className="text-[10px] font-bold text-dashboard-fg/75 group-hover:text-dashboard-fg transition-colors">
            {currentTheme.label}
          </span>
        </div>
        <ChevronUp
          size={12}
          className={`text-dashboard-fg/45 transition-transform duration-300 ${isOpen ? "rotate-0" : "rotate-180"}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-xl border border-white/10 bg-dashboard-bg/90 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;

            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                  isActive
                    ? "bg-accent-primary/10 text-dashboard-fg"
                    : "text-dashboard-fg/60 hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    size={12}
                    className={
                      isActive ? "text-accent-primary" : "text-dashboard-fg/45"
                    }
                  />
                  <span className="text-[11px] font-bold">{t.label}</span>
                </div>
                {isActive && (
                  <Check size={12} className="text-accent-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
