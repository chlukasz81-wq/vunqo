"use client";

import { createPortal } from "react-dom";

export type AddInflowChoiceModalProps = {
  portalReady: boolean;
  onClose: () => void;
  onPlanned: () => void;
  onManual: () => void;
  onImport: () => void;
};

const TILE_CLASS =
  "flex min-h-[5.5rem] w-full flex-col items-start justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300";

export function AddInflowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100"
    >
      Dodaj wpływ
    </button>
  );
}

export function AddInflowChoiceModal({
  portalReady,
  onClose,
  onPlanned,
  onManual,
  onImport,
}: AddInflowChoiceModalProps) {
  if (!portalReady) return null;

  const pick = (action: () => void) => {
    onClose();
    action();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="my-4 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-inflow-choice-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3
          id="add-inflow-choice-title"
          className="mb-5 text-lg font-semibold text-slate-900"
        >
          Dodaj wpływ
        </h3>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={TILE_CLASS}
            onClick={() => pick(onPlanned)}
          >
            Dodaj planowany wpływ
          </button>
          <button
            type="button"
            className={TILE_CLASS}
            onClick={() => pick(onManual)}
          >
            Dodaj rzeczywisty wpływ ręcznie
          </button>
          <button
            type="button"
            className={TILE_CLASS}
            onClick={() => pick(onImport)}
          >
            Importuj wpływy z wyciągu
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
