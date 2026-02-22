import { CloseCircle, TickCircle, InfoCircle, Warning2 } from "iconsax-react";
import { useToast, type ToastType } from "~/lib/context/toast";

const TOAST_STYLES: Record<ToastType, string> = {
  success: "bg-white border-emerald-200 text-emerald-700",
  error: "bg-white border-red-200 text-red-600",
  info: "bg-white border-blue-200 text-blue-700",
  warning: "bg-white border-amber-200 text-amber-700",
};

const TOAST_ICONS: Record<ToastType, typeof TickCircle> = {
  success: TickCircle,
  error: CloseCircle,
  info: InfoCircle,
  warning: Warning2,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const Icon = TOAST_ICONS[t.type];
        return (
          <div
            key={t.id}
            className={[
              "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto",
              "animate-in slide-in-from-right-4 duration-300",
              TOAST_STYLES[t.type],
            ].join(" ")}
          >
            <Icon size={18} color="currentColor" variant="Bulk" className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <CloseCircle size={16} color="currentColor" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
