import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  onClick?: () => void;
}

const PADDING: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  className = "",
  padding = "md",
  hoverable = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        "bg-white border border-zinc-200 rounded-xl",
        PADDING[padding],
        hoverable
          ? "hover:border-zinc-300 transition-colors cursor-pointer"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
