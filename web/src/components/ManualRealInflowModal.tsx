"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { QuickAddCategoryModal } from "@/components/CategoryManagerModal";
import {
  applyIncomeSourceDefaults,
  CUSTOM_INCOME_SOURCE_VALUE,
  findIncomeSourceById,
  IncomeSourceSelectField,
} from "@/components/IncomeSourceSelectField";
import type { BudgetCategory, BudgetEntry } from "@/data/budget-mock";
import type { IncomeSource } from "@/data/income-sources-mock";
import { createEntryId, getTodayDateInputValue } from "@/lib/budget-utils";
import {
  createIncomeSourceId,
  findIncomeSourceByName,
  formatIncomeDescription,
} from "@/lib/income-source-utils";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

export type ManualRealInflowModalProps = {
  portalReady: boolean;
  categories: BudgetCategory[];
  allCategories: BudgetCategory[];
  incomeSources: IncomeSource[];
  onClose: () => void;
  onSubmit: (entry: BudgetEntry) => void;
  onAddCategory: (category: BudgetCategory) => void;
  onAddIncomeSource: (source: IncomeSource) => void;
};

export function ManualRealInflowModal({
  portalReady,
  categories,
  allCategories,
  incomeSources,
  onClose,
  onSubmit,
  onAddCategory,
  onAddIncomeSource,
}: ManualRealInflowModalProps) {
  const [date, setDate] = useState(getTodayDateInputValue);

  useEffect(() => {
    if (!portalReady) return;
    setDate(getTodayDateInputValue());
  }, [portalReady]);
  const [selectedSourceId, setSelectedSourceId] = useState(
    incomeSources[0]?.id ?? CUSTOM_INCOME_SOURCE_VALUE,
  );
  const [customSourceName, setCustomSourceName] = useState("");
  const [name, setName] = useState(incomeSources[0]?.name ?? "");
  const [category, setCategory] = useState(
    incomeSources[0]?.defaultCategory ?? categories[0]?.name ?? "",
  );
  const [amount, setAmount] = useState("");
  const [invoiceRef, setInvoiceRef] = useState(() =>
    formatIncomeDescription(incomeSources[0]?.defaultDescription),
  );
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      setCategory("");
      return;
    }
    if (!categories.some((c) => c.name === category)) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  const handleSourceSelect = (id: string) => {
    setSelectedSourceId(id);
    if (id === CUSTOM_INCOME_SOURCE_VALUE) {
      setName(customSourceName);
      return;
    }
    const source = findIncomeSourceById(incomeSources, id);
    if (!source) return;
    applyIncomeSourceDefaults(source, {
      setName,
      setCategory,
      setInvoiceRef,
    });
  };

  if (!portalReady) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    const resolvedName =
      selectedSourceId === CUSTOM_INCOME_SOURCE_VALUE
        ? customSourceName.trim() || name.trim()
        : name.trim();
    let selectedSource =
      selectedSourceId !== CUSTOM_INCOME_SOURCE_VALUE
        ? findIncomeSourceById(incomeSources, selectedSourceId)
        : undefined;
    if (!resolvedName || !category || Number.isNaN(parsed) || parsed <= 0) {
      return;
    }
    if (selectedSourceId === CUSTOM_INCOME_SOURCE_VALUE) {
      const existing = findIncomeSourceByName(incomeSources, resolvedName);
      if (existing) {
        selectedSource = existing;
      } else {
        const created: IncomeSource = {
          id: createIncomeSourceId(),
          name: resolvedName,
          defaultCategory: category,
          defaultType: "rzeczywisty wpływ",
          defaultDescription: invoiceRef.trim() || undefined,
        };
        onAddIncomeSource(created);
        selectedSource = created;
      }
    }
    onSubmit({
      id: createEntryId(),
      date,
      name: resolvedName,
      incomeSourceId: selectedSource?.id,
      category,
      type: "rzeczywisty wpływ",
      amount: parsed,
      cyclic: false,
      paymentStatus: "zapłacone",
      invoiceRef: invoiceRef.trim(),
      dueDate: date,
      paidDate: date,
    });
  };

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
          Rzeczywisty wpływ ręcznie
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
          <IncomeSourceSelectField
            incomeSources={incomeSources}
            revenueCategories={categories}
            selectedId={selectedSourceId}
            customName={customSourceName}
            onSelectId={handleSourceSelect}
            onCustomNameChange={(value) => {
              setCustomSourceName(value);
              setName(value);
            }}
            portalReady={portalReady}
            onAddIncomeSource={onAddIncomeSource}
          />
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Kategoria
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} min-w-0 flex-1`}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title="Dodaj kategorię"
                onClick={() => setQuickAddOpen(true)}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-medium text-sky-700 hover:border-sky-400 hover:bg-sky-50"
              >
                +
              </button>
            </div>
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
            Numer dokumentu / opis wpływu
            <input
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              className={inputClass}
            />
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
        {quickAddOpen && (
          <QuickAddCategoryModal
            portalReady={portalReady}
            presetType="planowany przychód"
            categories={allCategories}
            onClose={() => setQuickAddOpen(false)}
            onAdd={(cat) => {
              onAddCategory(cat);
              setCategory(cat.name);
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
