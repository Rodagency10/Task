import React from "react";
import { TrendUp, TrendDown, Minus } from "iconsax-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon: React.ReactNode;
  iconColor?: string;
}

const TREND_CONFIG = {
  up: { icon: TrendUp, color: "text-emerald-600" },
  down: { icon: TrendDown, color: "text-red-600" },
  neutral: { icon: Minus, color: "text-zinc-400" },
};

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  iconColor = "text-zinc-500",
}: StatCardProps) {
  const TrendIcon = trend ? TREND_CONFIG[trend].icon : null;
  const trendColor = trend ? TREND_CONFIG[trend].color : "";

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 flex gap-4 items-start">
      {/* Icon */}
      <div className={["p-2.5 rounded-lg bg-zinc-100 shrink-0", iconColor].join(" ")}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-2xl font-bold text-zinc-950 truncate">{value}</p>
        {trend && TrendIcon && trendLabel && (
          <div className={["flex items-center gap-1 text-xs font-medium", trendColor].join(" ")}>
            <TrendIcon size={14} color="currentColor" />
            <span>{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
