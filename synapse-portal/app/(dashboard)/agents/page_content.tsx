"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Zap, X, Brain, Sliders, ShieldAlert } from "lucide-react";
import TiltCard from "@/components/landing/TiltCard";
import Avatar from "@/components/shared/Avatar";

interface Agent {
  name: string;
  displayName: string;
  title: string;
  icon: string;
  capabilities: string;
  role: string;
  identity?: string;
  communicationStyle?: string;
  principles?: string;
  module?: string;
  path?: string;
  complianceChecklist?: string[];
  capabilitiesList?: { code: string; description: string; skill: string }[];
  principlesList?: string[];
  protocols?: {
    contextLoad?: string;
    gatekeeper?: string;
  };
}

interface Skill {
  canonicalId: string;
  name: string;
  description: string;
  module: string;
  path: string;
}

export default function AgentsPageContent({
  agents,
  skills,
}: {
  agents: Agent[];
  skills: Skill[];
}) {
  const { t } = useI18n();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "protocols" | "capabilities"
  >("overview");

  // Reset tab when agent changes
  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setActiveTab("overview");
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-8">
        <section>
          <h2 className="text-3xl font-black tracking-tight text-dashboard-fg uppercase italic">
            {t("agents_skills")}
            <span className="text-indigo-500">.</span>
          </h2>
          <p className="text-xs font-medium text-slate-500">
            {t("agents_subtitle")}
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <TiltCard
              key={agent.name}
              onClick={() => handleSelectAgent(agent)}
              style={{ "--delay-index": (i % 3) + 1 } as React.CSSProperties}
              className="stagger-item group relative rounded-2xl glass hover:bg-foreground/5 p-6 transition-all cursor-pointer"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500/20 bg-dashboard-bg/50 p-1 shadow-lg relative">
                  <Avatar
                    seed={agent.displayName || agent.name}
                    width={40}
                    height={40}
                  />
                  <span className="absolute -bottom-1 -right-1 text-sm bg-dashboard-bg border border-dashboard-fg/10 rounded-full p-0.5 leading-none shadow-md">
                    {agent.icon}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black tracking-tight text-dashboard-fg leading-none">
                    {agent.displayName || agent.name}
                  </h4>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                    {agent.title}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                {agent.role}
              </p>

              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                  {t("capabilities")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities
                    .split(",")
                    .slice(0, 4)
                    .map((cap) => (
                      <span
                        key={cap}
                        className="rounded-md bg-foreground/5 px-2 py-0.5 text-[9px] font-bold text-slate-500"
                      >
                        {cap.trim()}
                      </span>
                    ))}
                  {agent.capabilities.split(",").length > 4 && (
                    <span className="text-[9px] font-bold text-slate-600 px-1">
                      {t("more", {
                        count: agent.capabilities.split(",").length - 4,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <section>
          <h2 className="text-2xl font-black tracking-tight text-dashboard-fg uppercase italic">
            {t("technical_skills")}
            <span className="text-emerald-500">.</span>
          </h2>
          <p className="text-xs font-medium text-slate-500">
            {t("skills_subtitle")}
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill, i) => (
            <TiltCard
              key={skill.canonicalId}
              style={{ "--delay-index": (i % 2) + 1 } as React.CSSProperties}
              className="stagger-item flex items-start gap-4 rounded-xl glass hover:bg-foreground/5 p-4 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-500">
                <Zap size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-dashboard-fg">
                    {skill.name}
                  </h4>
                  <span className="rounded bg-foreground/5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-slate-500">
                    {skill.module}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-dashboard-bg/95 border border-dashboard-fg/10 rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col text-dashboard-fg">
            {/* Glowing gradient back-lights */}
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setSelectedAgent(null)}
              className="absolute top-6 right-6 text-dashboard-fg/60 hover:text-dashboard-fg transition-colors cursor-pointer z-10 p-1.5 rounded-full hover:bg-dashboard-fg/5"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-5 border-b border-dashboard-fg/10 pb-6 mb-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500/20 bg-dashboard-bg/50 p-1 shadow-xl">
                <Avatar
                  seed={selectedAgent.displayName || selectedAgent.name}
                  width={56}
                  height={56}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-black text-dashboard-fg tracking-tight uppercase">
                    {selectedAgent.displayName || selectedAgent.name}
                  </h3>
                  <span className="text-2xl">{selectedAgent.icon}</span>
                </div>
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-1">
                  {selectedAgent.title}
                </p>
                <p className="text-sm text-dashboard-fg/80 mt-2 font-medium">
                  {selectedAgent.role}
                </p>
              </div>
            </div>

            {/* Tabs Controller */}
            <div className="flex border-b border-dashboard-fg/5 mb-6 gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-dashboard-fg"
                    : "border-transparent text-dashboard-fg/40 hover:text-dashboard-fg/70"
                }`}
              >
                {t("overview")}
              </button>
              {((selectedAgent.complianceChecklist &&
                selectedAgent.complianceChecklist.length > 0) ||
                selectedAgent.protocols?.contextLoad ||
                selectedAgent.protocols?.gatekeeper) && (
                <button
                  onClick={() => setActiveTab("protocols")}
                  className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === "protocols"
                      ? "border-indigo-500 text-dashboard-fg"
                      : "border-transparent text-dashboard-fg/40 hover:text-dashboard-fg/70"
                  }`}
                >
                  {t("system_protocols")}
                </button>
              )}
              <button
                onClick={() => setActiveTab("capabilities")}
                className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "capabilities"
                    ? "border-indigo-500 text-dashboard-fg"
                    : "border-transparent text-dashboard-fg/40 hover:text-dashboard-fg/70"
                }`}
              >
                {t("capabilities_tools")}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {selectedAgent.identity && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                        <Brain size={12} /> {t("identity")}
                      </h4>
                      <p className="text-sm text-dashboard-fg/80 leading-relaxed font-medium">
                        {selectedAgent.identity}
                      </p>
                    </div>
                  )}

                  {selectedAgent.communicationStyle && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                        <Sliders size={12} /> {t("communication_style")}
                      </h4>
                      <p className="text-sm text-dashboard-fg/70 leading-relaxed italic border-l-2 border-purple-500/30 pl-4 py-1 bg-purple-500/[0.02]">
                        &ldquo;{selectedAgent.communicationStyle}&rdquo;
                      </p>
                    </div>
                  )}

                  {selectedAgent.principlesList &&
                  selectedAgent.principlesList.length > 0 ? (
                    <div className="space-y-3 bg-dashboard-fg/[0.02] border border-dashboard-fg/5 rounded-2xl p-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-2">
                        <ShieldAlert size={12} /> {t("core_principles")}
                      </h4>
                      <ul className="space-y-2.5">
                        {selectedAgent.principlesList.map(
                          (principle, index) => (
                            <li
                              key={index}
                              className="text-xs text-dashboard-fg/85 flex items-start gap-2 leading-relaxed"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                              <span>{principle}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : selectedAgent.principles ? (
                    <div className="space-y-2 bg-dashboard-fg/[0.02] border border-dashboard-fg/5 rounded-2xl p-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-2">
                        <ShieldAlert size={12} /> {t("core_principles")}
                      </h4>
                      <p className="text-xs text-dashboard-fg/85 leading-relaxed whitespace-pre-wrap">
                        {selectedAgent.principles}
                      </p>
                    </div>
                  ) : null}

                  {/* System Module & Path details */}
                  <div className="border-t border-dashboard-fg/5 pt-4 flex flex-wrap gap-x-8 gap-y-2 text-[10px] text-dashboard-fg/40 font-bold uppercase tracking-widest">
                    <span>
                      {t("module")}:{" "}
                      <span className="text-dashboard-fg/60">
                        {selectedAgent.module || "synapse"}
                      </span>
                    </span>
                    <span>
                      {t("path")}:{" "}
                      <span className="text-dashboard-fg/60 lowercase">
                        {selectedAgent.path || "n/a"}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "protocols" && (
                <div className="space-y-6">
                  {selectedAgent.complianceChecklist &&
                    selectedAgent.complianceChecklist.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                          {t("compliance_checklist")}
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {selectedAgent.complianceChecklist.map(
                            (item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 bg-dashboard-fg/[0.02] border border-dashboard-fg/5 rounded-xl p-3"
                              >
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                                  {t("checkmark")}
                                </div>
                                <span className="text-xs font-semibold text-dashboard-fg/80 leading-tight">
                                  {item}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {selectedAgent.protocols?.gatekeeper && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                        {t("gatekeeper_protocol")}
                      </h4>
                      <div className="bg-rose-500/[0.03] border border-rose-500/20 rounded-2xl p-5 text-xs text-rose-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedAgent.protocols.gatekeeper}
                      </div>
                    </div>
                  )}

                  {selectedAgent.protocols?.contextLoad && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                        {t("context_loading_sequence")}
                      </h4>
                      <div className="bg-indigo-500/[0.03] border border-indigo-500/20 rounded-2xl p-5 text-xs text-dashboard-fg/80 leading-relaxed whitespace-pre-wrap">
                        {selectedAgent.protocols.contextLoad}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "capabilities" && (
                <div className="space-y-6">
                  {selectedAgent.capabilitiesList &&
                    selectedAgent.capabilitiesList.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          {t("mapped_capabilities")}
                        </h4>
                        <div className="border border-dashboard-fg/5 rounded-2xl overflow-hidden divide-y divide-dashboard-fg/5">
                          {selectedAgent.capabilitiesList.map((cap, index) => (
                            <div
                              key={index}
                              className="p-4 flex items-start gap-4 bg-dashboard-fg/[0.01] hover:bg-dashboard-fg/[0.03] transition-colors"
                            >
                              <div className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-xs font-black text-indigo-400 uppercase tracking-wider shrink-0 min-w-10 text-center font-mono">
                                {cap.code}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-dashboard-fg/90 font-semibold leading-relaxed">
                                  {cap.description}
                                </p>
                                <span className="mt-1 inline-block rounded bg-dashboard-fg/5 px-1.5 py-0.5 text-[9px] font-bold text-dashboard-fg/40">
                                  {cap.skill}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Capabilities (Full badge list) */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-dashboard-fg/50">
                      {t("system_capabilities")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.capabilities.split(",").map((cap) => (
                        <span
                          key={cap}
                          className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        >
                          {cap.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
