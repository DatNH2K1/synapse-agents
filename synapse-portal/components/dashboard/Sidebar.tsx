"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  Brain,
  ShieldCheck,
  UserCircle2,
  Settings,
  Bell,
  ChevronUp,
  Menu,
  Network,
} from "lucide-react";
import NavItem from "@/components/shared/NavItem";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/shared/ThemeSwitcher";
import Avatar from "@/components/shared/Avatar";
import { useI18n } from "@/lib/i18n";
import { useRealtime } from "@/components/shared/RealtimeProvider";

export default function Sidebar({
  userName = "Chief Architect",
  pendingCount: initialPendingCount = 0,
  isFullscreen = false,
}: {
  userName?: string;
  pendingCount?: number;
  isFullscreen?: boolean;
}) {
  const { t } = useI18n();
  const { pendingCount: livePendingCount } = useRealtime();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const pendingCount =
    livePendingCount !== undefined ? livePendingCount : initialPendingCount;

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    if (isMoreOpen) {
      document.addEventListener("mousedown", onClickOutside);
      return () => document.removeEventListener("mousedown", onClickOutside);
    }
  }, [isMoreOpen]);

  return (
    <>
      <aside
        className={`hidden lg:flex lg:z-40 lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-white/5 lg:glass lg:transition-all lg:duration-500 ${
          isFullscreen ? "lg:-ml-64" : "lg:ml-0"
        }`}
      >
        <div className="p-6">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary shadow-lg shadow-accent-primary/40">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-black leading-none tracking-tight text-dashboard-fg">
                {t("brand_name")}
                <span className="text-accent-primary">.</span>
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-dashboard-fg/55">
                {t("intelligence_os")}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label={t("overview")}
            href="/dashboard"
          />
          <NavItem
            icon={<Network size={18} />}
            label={t("dependency_graph")}
            href="/dependency-graph"
          />
          <NavItem
            icon={<ShieldCheck size={18} />}
            label={t("the_gate")}
            badge={pendingCount}
            href="/gate"
          />

          <NavItem
            icon={<UserCircle2 size={18} />}
            label={t("agents_skills")}
            href="/agents"
          />
          <NavItem
            icon={<Settings size={18} />}
            label={t("settings")}
            href="/settings"
          />
        </nav>

        <div className="space-y-3 border-t border-white/5 p-4">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4 px-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-dashboard-bg/70">
                <Avatar seed={userName} width={32} height={32} />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-[10px] font-black uppercase tracking-wider text-dashboard-fg">
                  {userName}
                </p>
              </div>
            </div>
            <button className="relative p-1.5 text-dashboard-fg/55 hover:text-accent-primary transition-colors">
              <Bell size={18} />
              {pendingCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent-primary" />
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-[120] border-b border-white/10 bg-dashboard-bg/90 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary shadow-lg shadow-accent-primary/40">
              <Brain size={18} className="text-white" />
            </div>
            <div className="hidden min-[390px]:block">
              <p className="text-sm font-black leading-none tracking-tight text-dashboard-fg">
                {t("brand_name")}
                <span className="text-accent-primary">.</span>
              </p>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-dashboard-fg/55">
                {t("intelligence_os")}
              </p>
            </div>
          </Link>

          <div className="relative shrink-0" ref={moreRef}>
            <button
              onClick={() => setIsMoreOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-dashboard-fg/70"
            >
              <Menu size={14} className="text-accent-primary" />
              {t("more_button")}
              <ChevronUp
                size={12}
                className={`text-dashboard-fg/45 transition-transform duration-300 ${
                  isMoreOpen ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-[18rem] rounded-2xl border border-white/10 bg-dashboard-bg/95 p-2 shadow-2xl backdrop-blur-xl">
                <div className="space-y-2">
                  <NavItem
                    icon={<LayoutDashboard size={16} />}
                    label={t("overview")}
                    href="/dashboard"
                    compact
                    mobileOnly
                  />
                  <NavItem
                    icon={<Network size={16} />}
                    label={t("dependency_graph")}
                    href="/dependency-graph"
                    compact
                    mobileOnly
                  />
                  <NavItem
                    icon={<ShieldCheck size={16} />}
                    label={t("the_gate")}
                    badge={pendingCount}
                    href="/gate"
                    compact
                    mobileOnly
                  />
                  <NavItem
                    icon={<UserCircle2 size={16} />}
                    label={t("agents_skills")}
                    href="/agents"
                    compact
                    mobileOnly
                  />
                  <NavItem
                    icon={<Settings size={16} />}
                    label={t("settings")}
                    href="/settings"
                    compact
                    mobileOnly
                  />
                  <div className="pt-2">
                    <LanguageSwitcher />
                  </div>
                  <ThemeSwitcher />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
