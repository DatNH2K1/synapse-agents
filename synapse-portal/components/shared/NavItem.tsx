import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavItem({
  icon,
  label,
  href,
  badge = 0,
  compact = false,
  mobileOnly = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
  compact?: boolean;
  mobileOnly?: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center rounded-xl transition-all duration-200 ${
        compact ? "w-auto shrink-0" : "w-full"
      } ${mobileOnly ? "lg:hidden" : ""} ${
        active
          ? "bg-accent-primary text-white shadow-md shadow-accent-primary/20"
          : "text-dashboard-fg/55 hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
      }`}
    >
      <div
        className={`flex w-full items-center ${
          compact
            ? "w-auto flex-col gap-1 px-2 py-2 justify-center"
            : "justify-between px-4 py-2.5 gap-3"
        }`}
      >
        <div
          className={`flex items-center ${compact ? "w-auto justify-center" : "gap-3"}`}
        >
          {icon}
          <span
            className={`font-bold tracking-tight ${
              compact ? "text-[9px]" : "text-xs"
            }`}
          >
            {label}
          </span>
        </div>
        {badge > 0 && (
          <span
            className={`rounded-md bg-dashboard-fg/10 font-black ${
              compact ? "px-1.5 py-0 text-[8px]" : "px-1.5 py-0.5 text-[9px]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}
