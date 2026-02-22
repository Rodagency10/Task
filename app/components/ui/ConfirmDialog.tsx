import { useConfirmState } from "~/lib/context/confirm";
import { Button } from "~/components/ui/Button";
import { Danger } from "iconsax-react";

export function ConfirmDialog() {
  const { pending, handleConfirm, handleCancel } = useConfirmState();

  if (!pending) return null;

  const { options } = pending;
  const isDanger = options.variant === "danger";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Panel */}
      <div className="relative bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        {/* Icon */}
        {isDanger && (
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 mx-auto mb-4">
            <Danger size={24} color="currentColor" variant="Bulk" className="text-red-500" />
          </div>
        )}

        <h2 className="text-base font-semibold text-zinc-950 text-center">
          {options.title}
        </h2>

        {options.message && (
          <p className="text-sm text-zinc-500 text-center mt-1.5">{options.message}</p>
        )}

        <div className="flex gap-3 mt-5">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCancel}
          >
            {options.cancelLabel ?? "Annuler"}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            className="flex-1"
            onClick={handleConfirm}
          >
            {options.confirmLabel ?? "Confirmer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
