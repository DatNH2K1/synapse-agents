"use client";

import React from "react";
import Link from "next/link";
import { Brain, ArrowLeft, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="landing-3d-scene min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center overflow-hidden relative font-sans">
      {/* Background Gradients & Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] z-0" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="landing-perspective-grid absolute inset-x-0 bottom-0 h-[20rem] pointer-events-none z-0 opacity-40" />

      {/* Main Card */}
      <div className="relative z-10 max-w-md w-full mx-auto px-6 text-center">
        {/* Glowing Brain Icon Container */}
        <div className="mb-8 relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/30 rounded-2xl blur-xl animate-pulse" />
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 shadow-xl shadow-indigo-600/30 relative animate-float">
            <Brain size={44} className="text-indigo-400" />
          </div>
        </div>

        {/* 404 Title */}
        <h1 className="text-8xl font-black tracking-tight text-white mb-2 leading-none text-glow font-display">
          404
        </h1>

        {/* Partition Error Subtitle */}
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1 rounded-full inline-block">
          ERR_MEMORY_PARTITION_NOT_FOUND
        </p>

        {/* Error message */}
        <h2 className="text-2xl font-extrabold text-white mb-3">
          {t("not_found_title")}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
          {t("not_found_desc")}
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home size={14} /> {t("back_to_home")}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-6 py-3.5 rounded-xl transition-all"
          >
            <ArrowLeft size={14} /> {t("go_back")}
          </button>
        </div>
      </div>

      {/* Small footer brand */}
      <div className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1.5 z-10">
        <Brain size={12} className="text-indigo-500/60" /> {t("synapse_os")}
      </div>
    </div>
  );
}
