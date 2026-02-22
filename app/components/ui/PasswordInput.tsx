import { useState } from "react";
import { Eye, EyeSlash } from "iconsax-react";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export function PasswordInput({ label, error, id, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={[
            "w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 pr-10",
            "text-lg text-zinc-800 placeholder:text-zinc-400",
            "focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-400 transition-colors",
            error ? "border-red-400 focus:ring-red-300" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? (
            <EyeSlash size={18} color="currentColor" />
          ) : (
            <Eye size={18} color="currentColor" />
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
