"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { BudgetCategory } from "@/data/budget-mock";
import type { IncomeSource } from "@/data/income-sources-mock";
import {
  createIncomeSourceId,
  findIncomeSourceById,
  formatIncomeDescription,
  incomeSourceExists,
} from "@/lib/income-source-utils";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

export const CUSTOM_INCOME_SOURCE_VALUE = "__custom_income__";

export type IncomeSourceSelectFieldProps = {
  incomeSources: IncomeSource[];
  revenueCategories: BudgetCategory[];
  selectedId: string;
  customName: string;
  onSelectId: (id: string) => void;
  onCustomNameChange: (name: string) => void;
  portalReady: boolean;
  onAddIncomeSource: (source: IncomeSource) => void;
};

export function IncomeSourceSelectField({
  incomeSources,
  revenueCategories,
  selectedId,
  customName,
  onSelectId,
  onCustomNameChange,
  portalReady,
  onAddIncomeSource,
}: IncomeSourceSelectFieldProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Nazwa wpływu / źródło pieniędzy
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => onSelectId(e.target.value)}
            className={`${inputClass} min-w-0 flex-1`}
            required={selectedId !== CUSTOM_INCOME_SOURCE_VALUE}
          >
            {incomeSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
            <option value={CUSTOM_INCOME_SOURCE_VALUE}>— inna nazwa —</option>
          </select>
          <button
            type="button"
            title="Dodaj źródło wpływu"
            onClick={() => setQuickAddOpen(true)}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-medium text-sky-700 shadow-sm hover:border-sky-400 hover:bg-sky-50"
          >
            +
          </button>
        </div>
      </label>
      {selectedId === CUSTOM_INCOME_SOURCE_VALUE && (
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Wpisz własną nazwę wpływu
          <input
            type="text"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            className={inputClass}
            required
          />
        </label>
      )}
      {quickAddOpen && (
        <QuickAddIncomeSourceModal
          portalReady={portalReady}
          incomeSources={incomeSources}
          revenueCategories={revenueCategories}
          onClose={() => setQuickAddOpen(false)}
          onAdd={(source) => {
            onAddIncomeSource(source);
            onSelectId(source.id);
          }}
        />
      )}
    </>
  );
}

export function applyIncomeSourceDefaults(
  source: IncomeSource,
  setters: {
    setName: (v: string) => void;
    setCategory: (v: string) => void;
    setInvoiceRef: (v: string) => void;
  },
) {
  setters.setName(source.name);
  setters.setCategory(source.defaultCategory);
  setters.setInvoiceRef(formatIncomeDescription(source.defaultDescription));
}

export type QuickAddIncomeSourceModalProps = {
  portalReady: boolean;
  incomeSources: IncomeSource[];
  revenueCategories: BudgetCategory[];
  onClose: () => void;
  onAdd: (source: IncomeSource) => void;
};

export function QuickAddIncomeSourceModal({
  portalReady,
  incomeSources,
  revenueCategories,
  onClose,
  onAdd,
}: QuickAddIncomeSourceModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(revenueCategories[0]?.name ?? "");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !category) return;
    if (incomeSourceExists(incomeSources, trimmed)) {
      setError("Źródło o tej nazwie już istnieje.");
      return;
    }
    const created: IncomeSource = {
      id: createIncomeSourceId(),
      name: trimmed,
      defaultCategory: category,
      defaultType: "oba",
      defaultDescription: description.trim() || undefined,
    };
    onAdd(created);
    onClose();
  };

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
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Dodaj źródło wpływu
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Nazwa
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className={inputClass}
              required
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Domyślna kategoria
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
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Domyślny opis
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. PayU — wpływ"
              className={inputClass}
            />
          </label>
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
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
              Dodaj i wybierz
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export { findIncomeSourceById };
