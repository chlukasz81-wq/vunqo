"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CategoriesManagerPanel } from "@/components/budget-settings/CategoriesManagerPanel";
import { CostNamesManagerPanel } from "@/components/budget-settings/CostNamesManagerPanel";
import { CyclicPaymentsPanel } from "@/components/budget-settings/CyclicPaymentsPanel";
import { IncomeSourcesManagerPanel } from "@/components/budget-settings/IncomeSourcesManagerPanel";
import type { BudgetCategory, BudgetEntry } from "@/data/budget-mock";
import type { CostName } from "@/data/cost-names-mock";
import type { IncomeSource } from "@/data/income-sources-mock";

const TABS = [
  { id: "cost-categories", label: "Kategorie kosztów" },
  { id: "income-categories", label: "Kategorie wpływów" },
  { id: "cost-names", label: "Nazwy kosztów" },
  { id: "income-sources", label: "Nazwy wpływów" },
  { id: "cyclic", label: "Cykliczne płatności" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export type BudgetSettingsModalProps = {
  portalReady: boolean;
  categories: BudgetCategory[];
  entries: BudgetEntry[];
  costNames: CostName[];
  incomeSources: IncomeSource[];
  costCategories: BudgetCategory[];
  revenueCategories: BudgetCategory[];
  onClose: () => void;
  onAddCategory: (category: BudgetCategory) => void;
  onUpdateCategory: (category: BudgetCategory, previousName: string) => void;
  onDeleteCategory: (
    id: string,
    strategy: "move-to-other" | "clear-category",
  ) => void;
  onAddCostName: (costName: CostName) => void;
  onUpdateCostName: (costName: CostName, previousName: string) => void;
  onDeleteCostName: (
    id: string,
    strategy: "clear" | "reassign",
    reassignToId?: string,
  ) => void;
  onAddIncomeSource: (source: IncomeSource) => void;
  onUpdateIncomeSource: (source: IncomeSource, previousName: string) => void;
  onDeleteIncomeSource: (
    id: string,
    strategy: "clear" | "reassign",
    reassignToId?: string,
  ) => void;
  onConfirmCyclic: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onClearTestData: () => void;
};

function SettingsShell({
  onClose,
  children,
  portalReady,
}: {
  onClose: () => void;
  children: ReactNode;
  portalReady: boolean;
}) {
  if (!portalReady) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-slate-200 bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-settings-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function BudgetSettingsModal({
  portalReady,
  categories,
  entries,
  costNames,
  incomeSources,
  costCategories,
  revenueCategories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddCostName,
  onUpdateCostName,
  onDeleteCostName,
  onAddIncomeSource,
  onUpdateIncomeSource,
  onDeleteIncomeSource,
  onConfirmCyclic,
  onDeleteEntry,
  onClearTestData,
}: BudgetSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("cost-categories");

  return (
    <SettingsShell onClose={onClose} portalReady={portalReady}>
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="budget-settings-title"
              className="text-lg font-semibold text-slate-900"
            >
              Ustawienia budżetu
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              <strong>Kategoria kosztu</strong> to grupa do raportów (np. ZUS i
              podatki, Reklamy). <strong>Nazwa kosztu</strong> to konkretny
              kontrahent lub płatność (np. ZUS, Allegro Ads).{" "}
              <strong>Kategoria wpływu</strong> grupuje przychody, a{" "}
              <strong>źródło pieniędzy</strong> to kanał wpływu (np. PayU,
              Allegro).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>
        <nav
          className="mt-4 flex flex-wrap gap-1 border-t border-slate-100 pt-3"
          aria-label="Zakładki ustawień"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "cost-categories" && (
          <CategoriesManagerPanel
            side="cost"
            categories={categories}
            entries={entries}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}
        {activeTab === "income-categories" && (
          <CategoriesManagerPanel
            side="income"
            categories={categories}
            entries={entries}
            onAddCategory={onAddCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}
        {activeTab === "cost-names" && (
          <CostNamesManagerPanel
            costNames={costNames}
            entries={entries}
            costCategories={costCategories}
            onAdd={onAddCostName}
            onUpdate={onUpdateCostName}
            onDelete={onDeleteCostName}
          />
        )}
        {activeTab === "income-sources" && (
          <IncomeSourcesManagerPanel
            incomeSources={incomeSources}
            entries={entries}
            revenueCategories={revenueCategories}
            onAdd={onAddIncomeSource}
            onUpdate={onUpdateIncomeSource}
            onDelete={onDeleteIncomeSource}
          />
        )}
        {activeTab === "cyclic" && (
          <CyclicPaymentsPanel
            entries={entries}
            costNames={costNames}
            onConfirmEntry={onConfirmCyclic}
            onDeleteEntry={onDeleteEntry}
          />
        )}
      </div>

      <div className="border-t border-slate-200 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Usunąć wszystkie operacje (koszty, wpływy, kolejka akceptacji)? Kategorie i nazwy kontrahentów pozostaną.",
                )
              ) {
                onClearTestData();
              }
            }}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
          >
            Wyczyść dane testowe
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Zamknij
          </button>
        </div>
      </div>
    </SettingsShell>
  );
}
