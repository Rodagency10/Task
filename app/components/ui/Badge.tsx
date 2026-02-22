interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-zinc-100 text-zinc-700 border border-zinc-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-600 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  muted: "bg-zinc-50 text-zinc-400 border border-zinc-200",
};

const DOT_COLORS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-zinc-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  muted: "bg-zinc-300",
};

const SIZES: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={["size-1.5 rounded-full shrink-0", DOT_COLORS[variant]].join(" ")}
        />
      )}
      {children}
    </span>
  );
}
