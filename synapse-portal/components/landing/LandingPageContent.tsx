"use client";

import React from "react";
import Link from "next/link";
import {
  Brain,
  LayoutDashboard,
  ShieldCheck,
  Activity,
  Sparkles,
  Cpu,
  ArrowRight,
  Zap,
  Tag as TagIcon,
  icons,
} from "lucide-react";
import Avatar from "@/components/shared/Avatar";
import { useI18n } from "@/lib/i18n";
import TiltCard from "@/components/landing/TiltCard";

export interface Agent {
  name: string;
  seed: string;
  title: string;
  icon: string;
  desc: string;
}

export default function LandingPageContent({
  userName,
  nodesCount,
  lessonCount,
  pendingCount,
  tagsCount,
  agents,
}: {
  userName: string;
  nodesCount: number;
  lessonCount: number;
  pendingCount: number;
  tagsCount: number;
  agents: Agent[];
}) {
  const { t } = useI18n();

  return (
    <div className="landing-3d-scene min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 font-sans relative">
      {/* Background Gradients & Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="landing-aurora absolute inset-x-0 top-[-12rem] h-[28rem] pointer-events-none z-0" />
      <div className="landing-perspective-grid absolute inset-x-0 top-24 h-[34rem] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-white/5 bg-[#030712]/40 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-black leading-none tracking-tight">
                {t("brand_name")}
                <span className="text-indigo-500">.</span>
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                {t("intelligence_os")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-400 bg-white/5 border border-white/5 rounded-full px-3 py-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("welcome_back", { name: userName })}
            </span>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
            >
              {t("enter_portal")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="hero-orb-3d pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-black uppercase tracking-widest mb-6 animate-pulse-slow">
          <Sparkles size={12} /> {t("local_first_graph")}
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 font-display max-w-5xl mx-auto leading-tight">
          {t("hero_title_1")} <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent text-glow">
            {t("hero_title_2")}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
          {t("hero_subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-3 text-base font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-8 py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 scale-100 hover:scale-[1.02]"
          >
            {t("launch_system")} <LayoutDashboard size={18} />
          </Link>
          <a
            href="#roster"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-8 py-4 rounded-xl transition-all"
          >
            {t("learn_agents")} <ArrowRight size={16} />
          </a>
        </div>

        {/* Real-time System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <TiltCard
            style={{ "--delay-index": 1 } as React.CSSProperties}
            className="stagger-item glass border-white/5 bg-white/[0.02] p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-500/20 transition-all"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-md" />
            <Activity
              size={24}
              className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform"
            />
            <span className="text-3xl font-black tracking-tight text-white">
              {nodesCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              {t("total_nodes_desc")}
            </span>
          </TiltCard>

          <TiltCard
            style={{ "--delay-index": 2 } as React.CSSProperties}
            className="stagger-item glass border-white/5 bg-white/[0.02] p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/20 transition-all"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-md" />
            <ShieldCheck
              size={24}
              className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform"
            />
            <span className="text-3xl font-black tracking-tight text-white">
              {lessonCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              {t("lessons_desc")}
            </span>
          </TiltCard>

          <TiltCard
            style={{ "--delay-index": 3 } as React.CSSProperties}
            className="stagger-item glass border-white/5 bg-white/[0.02] p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-amber-500/20 transition-all"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-md" />
            <Zap
              size={24}
              className="text-amber-400 mb-2 group-hover:scale-110 transition-transform"
            />
            <span className="text-3xl font-black tracking-tight text-white">
              {pendingCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              {t("pending_desc")}
            </span>
          </TiltCard>

          <TiltCard
            style={{ "--delay-index": 4 } as React.CSSProperties}
            className="stagger-item glass border-white/5 bg-white/[0.02] p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-purple-500/20 transition-all"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-md" />
            <TagIcon
              size={24}
              className="text-purple-400 mb-2 group-hover:scale-110 transition-transform"
            />
            <span className="text-3xl font-black tracking-tight text-white">
              {tagsCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              {t("tags_desc")}
            </span>
          </TiltCard>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl font-extrabold text-center text-white mb-4 font-display">
          {t("pillars_title")}
        </h2>
        <p className="text-slate-400 text-center max-w-2xl mx-auto mb-16">
          {t("pillars_subtitle")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TiltCard
            style={{ "--delay-index": 1 } as React.CSSProperties}
            className="stagger-item glass border-white/5 bg-white/[0.02] p-8 rounded-2xl relative overflow-hidden transition-all group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-6 group-hover:scale-110 transition-transform">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {t("pillar_1_title")}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("pillar_1_desc")}
            </p>
          </TiltCard>

          <TiltCard
            style={{ "--delay-index": 2 } as React.CSSProperties}
            className="stagger-item glass border-white/5 bg-white/[0.02] p-8 rounded-2xl relative overflow-hidden transition-all group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {t("pillar_2_title")}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("pillar_2_desc")}
            </p>
          </TiltCard>

          <TiltCard
            style={{ "--delay-index": 3 } as React.CSSProperties}
            className="stagger-item glass border-white/5 bg-white/[0.02] p-8 rounded-2xl relative overflow-hidden transition-all group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3
              className="text-xl font-bold text-white mb-3"
              dangerouslySetInnerHTML={{ __html: t("pillar_3_title") }}
            ></h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("pillar_3_desc")}
            </p>
          </TiltCard>
        </div>
      </section>

      {/* Roster Section */}
      <section
        id="roster"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white mb-4 font-display">
            {t("roster_title")}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {t("roster_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent: Agent, i: number) => {
            const IconComponent = (icons[agent.icon as keyof typeof icons] || icons.User) as React.ComponentType<{ size?: number; className?: string }>;

            return (
              <TiltCard
                key={i}
                maxTilt={7}
                style={{ "--delay-index": (i % 4) + 1 } as React.CSSProperties}
                className="stagger-item glass border-white/5 bg-white/[0.01] hover:bg-white/[0.03] p-6 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#030712]">
                      <Avatar seed={agent.seed} width={48} height={48} />
                    </div>
                    <IconComponent size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wider">
                    {agent.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {agent.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {agent.desc}
                  </p>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#030712] py-8 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-indigo-500" />
            <span>{t("footer_version")}</span>
          </div>
          <div dangerouslySetInnerHTML={{ __html: t("footer_crafted") }}></div>
        </div>
      </footer>
    </div>
  );
}
