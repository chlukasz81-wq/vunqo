"use client";

import { useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { BudgetCategory } from "@/data/budget-mock";
import type {
  ImportStatus,
  PendingInflow,
  RejectedInflow,
} from "@/data/pending-inflows-mock";
import {
  effectiveImportStatus,
  isSelectableForBulk,
  suggestedCategoryLabel,
} from "@/data/pending-inflows-mock";
import {
  createPendingInflowId,
  formatCurrency,
  formatDisplayDate,
} from "@/lib/budget-utils";

export type PendingInflowsPanelProps = {
  pending: PendingInflow[];
  rejected: RejectedInflow[];
  categories: BudgetCategory[];
  revenueCategories: BudgetCategory[];
  portalReady: boolean;
  onAccept: (ids: string[]) => void;
  onReject: (ids: string[]) => void;
  onUpdateCategory: (ids: string[], category: string) => void;
  onEdit: (item: PendingInflow) => void;
  onAdd: (item: PendingInflow) => void;
};

function CategoryChangeModal({
  portalReady,
  categories,
  selectedCount,
  onClose,
  onConfirm,
}: {
  portalReady: boolean;
  categories: BudgetCategory[];
  selectedCount: number;
  onClose: () => void;
  onConfirm: (category: string) => void;
}) {
  const [category, setCategory] = useState(categories[0]?.name ?? "");

  if (!portalReady) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">
          Zmień kategorię ({selectedCount})
        </h3>
        <label className="mt-4 flex flex-col gap-1 text-sm text-slate-600">
          Kategoria
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => onConfirm(category)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const IMPORT_STATUS_STYLES: Record<ImportStatus, string> = {
  nowy: "bg-slate-100 text-slate-700 ring-slate-200",
  "prawdopodobny duplikat": "bg-amber-50 text-amber-900 ring-amber-200",
  zaakceptowany: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  odzucony: "bg-rose-50 text-rose-800 ring-rose-200",
};

function ImportStatusBadge({ status }: { status: ImportStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${IMPORT_STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function PendingInflowsPanel({
  pending,
  rejected,
  categories: _categories,
  revenueCategories,
  portalReady,
  onAccept,
  onReject,
  onUpdateCategory,
  onEdit,
  onAdd,
}: PendingInflowsPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRejected, setShowRejected] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryEditItem, setCategoryEditItem] = useState<PendingInflow | null>(
    null,
  );

  const selectablePending = useMemo(
    () => pending.filter(isSelectableForBulk),
    [pending],
  );
  const allSelectableSelected =
    selectablePending.length > 0 &&
    selectablePending.every((p) => selected.has(p.id));
  const selectedIds = useMemo(
    () => pending.filter((p) => selected.has(p.id)).map((p) => p.id),
    [pending, selected],
  );

  const toggleAll = () => {
    if (allSelectableSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectablePending.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const requireSelection = (action: () => void) => {
    if (selectedIds.length === 0) return;
    action();
    setSelected(new Set());
  };

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
      <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-3 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Wpływy do akceptacji
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {pending.length} oczekujących — nie wliczają się do rzeczywistego bilansu
          do momentu akceptacji
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Przed akceptacją system pokazuje możliwe duplikaty, żeby nie dodać dwa
          razy tego samego wpływu.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Zaznacz wszystko
        </button>
        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={() =>
            requireSelection(() => onAccept(selectedIds))
          }
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
        >
          Akceptuj zaznaczone jako rzeczywisty wpływ
        </button>
        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={() =>
            requireSelection(() => onReject(selectedIds))
          }
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
        >
          Odrzuć zaznaczone
        </button>
        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={() => {
            if (selectedIds.length > 0) setCategoryModalOpen(true);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Zmień kategorię zaznaczonych
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="w-10 px-3 py-3 sm:px-4" />
              <th className="px-3 py-3 sm:px-4">Data</th>
              <th className="px-3 py-3 sm:px-4">Opis z wyciągu</th>
              <th className="px-3 py-3 text-right sm:px-4">Kwota</th>
              <th className="px-3 py-3 sm:px-4">Źródło / konto</th>
              <th className="px-3 py-3 sm:px-4">Sugerowana kategoria</th>
              <th className="px-3 py-3 sm:px-4">Status importu</th>
              <th className="min-w-[10rem] px-3 py-3 sm:px-4">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pending.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Brak wpływów do akceptacji.
                </td>
              </tr>
            ) : (
              pending.map((item) => {
                const importStatus = effectiveImportStatus(item);
                const selectable = isSelectableForBulk(item);
                return (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-3 sm:px-4">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      disabled={!selectable}
                      onChange={() => toggleOne(item.id)}
                      className="rounded border-slate-300 text-sky-600 disabled:opacity-40"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700 sm:px-4">
                    {formatDisplayDate(item.date)}
                  </td>
                  <td className="max-w-[16rem] px-3 py-3 font-medium text-slate-900 sm:px-4">
                    {item.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-emerald-700 sm:px-4">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-4">
                    {item.source}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-4">
                    {suggestedCategoryLabel(item) || "—"}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <ImportStatusBadge status={importStatus} />
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => onAccept([item.id])}
                        className="rounded border border-emerald-200 bg-white px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                      >
                        Akceptuj
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject([item.id])}
                        className="rounded border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Odrzuć
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryEditItem(item)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edytuj kategorię
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {rejected.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setShowRejected((v) => !v)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {showRejected ? "Ukryj" : "Pokaż"} odrzucone wpływy ({rejected.length})
          </button>
          {showRejected && (
            <ul className="mt-3 space-y-2">
              {rejected.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="flex flex-wrap items-center gap-2 text-slate-600">
                    {formatDisplayDate(item.date)} · {item.source} ·{" "}
                    {formatCurrency(item.amount)}
                    <ImportStatusBadge
                      status={effectiveImportStatus(item)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {categoryModalOpen && (
        <CategoryChangeModal
          portalReady={portalReady}
          categories={revenueCategories}
          selectedCount={selectedIds.length}
          onClose={() => setCategoryModalOpen(false)}
          onConfirm={(category) => {
            onUpdateCategory(selectedIds, category);
            setCategoryModalOpen(false);
            setSelected(new Set());
          }}
        />
      )}

      {categoryEditItem && (
        <EditCategoryModal
          portalReady={portalReady}
          item={categoryEditItem}
          revenueCategories={revenueCategories}
          onClose={() => setCategoryEditItem(null)}
          onSave={(category) => {
            onEdit({
              ...categoryEditItem,
              category,
              suggestedCategory: category,
            });
            setCategoryEditItem(null);
          }}
        />
      )}
    </section>
  );
}

function EditCategoryModal({
  portalReady,
  item,
  revenueCategories,
  onClose,
  onSave,
}: {
  portalReady: boolean;
  item: PendingInflow;
  revenueCategories: BudgetCategory[];
  onClose: () => void;
  onSave: (category: string) => void;
}) {
  const [category, setCategory] = useState(item.category);

  if (!portalReady) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(category);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          Edytuj kategorię
        </h3>
        <p className="mb-4 text-sm text-slate-600">{item.name}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Kategoria
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            >
              {revenueCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export type AddPendingInflowModalProps = {
  portalReady: boolean;
  revenueCategories: BudgetCategory[];
  defaultDate: string;
  onClose: () => void;
  onSubmit: (item: PendingInflow) => void;
};

export function AddPendingInflowModal({
  portalReady,
  revenueCategories,
  defaultDate,
  onClose,
  onSubmit,
}: AddPendingInflowModalProps) {
  const [date, setDate] = useState(defaultDate);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("mBank");
  const [category, setCategory] = useState(revenueCategories[0]?.name ?? "");

  if (!portalReady) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!name.trim() || Number.isNaN(parsed) || parsed <= 0) return;
    onSubmit({
      id: createPendingInflowId(),
      date,
      name: name.trim(),
      amount: parsed,
      source: source.trim(),
      category,
      suggestedCategory: category,
      importStatus: "nowy",
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Dodaj wpływy do akceptacji
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Data
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Opis
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Kwota (zł)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Źródło
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Sugerowana kategoria
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {revenueCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Dodaj
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
