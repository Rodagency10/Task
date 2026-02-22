import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="p-4 bg-zinc-100 rounded-2xl text-zinc-400 mb-2">
        {icon}
      </div>
      <p className="text-base font-semibold text-zinc-700">{title}</p>
      {description && (
        <p className="text-sm text-zinc-400 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
