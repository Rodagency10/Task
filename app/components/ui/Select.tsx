import React from "react";
import { ArrowDown2 } from "iconsax-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

const BASE =
  "w-full bg-white border border-zinc-200 rounded-lg pl-3 pr-9 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer transition-colors";

const ERROR = "border-red-400 focus:ring-red-400 focus:border-red-400";

export function Select({
  label,
  hint,
  error,
  placeholder,
  options,
  id,
  className = "",
  ...props
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={[BASE, error ? ERROR : "", className].join(" ")}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <ArrowDown2 size={14} color="currentColor" />
        </span>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
