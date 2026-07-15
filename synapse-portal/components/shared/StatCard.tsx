import React from "react";
import TiltCard from "@/components/landing/TiltCard";

export default function StatCard({
  label,
  value,
  icon,
  style,
  className = "",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <TiltCard
      style={style}
      className={`rounded-2xl glass p-6 transition-all hover:border-accent-primary/30 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3 items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10">
            {icon}
          </div>
          <div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
              {label}
            </p>
            <p className="text-3xl font-black tracking-tighter text-dashboard-fg">
              {value}
            </p>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
