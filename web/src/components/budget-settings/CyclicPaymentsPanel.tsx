"use client";

import { useMemo } from "react";
import type { BudgetEntry, CyclicStatus } from "@/data/budget-mock";
import type { CostName } from "@/data/cost-names-mock";
import { formatCurrency, formatOperationTypeLabel } from "@/lib/budget-utils";

export type CyclicRow = {
  id: string;
  name: string;
  typeLabel: string;
  amount: number;
  dayOfMonth: number | null;
  cyclicStatus: CyclicStatus | "—";
  source: "entry" | "costName";
  entryId?: string;
};

function dayFromDueDate(dueDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (!match) return null;
  return Number(match[3]);
}

function buildCyclicRows(
  entries: BudgetEntry[],
  costNames: CostName[],
): CyclicRow[] {
  const rows: CyclicRow[] = [];
  const seenCostNameIds = new Set<string>();

  for (const entry of entries) {
    if (!entry.cyclic) continue;
    rows.push({
      id: `entry-${entry.id}`,
      name: entry.costName ?? entry.name,
      typeLabel: formatOperationTypeLabel(entry.type),
      amount: entry.amount,
      dayOfMonth: dayFromDueDate(entry.dueDate),
      cyclicStatus: entry.cyclicStatus ?? "—",
      source: "entry",
      entryId: entry.id,
    });
    if (entry.costNameId) seenCostNameIds.add(entry.costNameId);
  }

  for (const cn of costNames) {
    if (!cn.cyclic || seenCostNameIds.has(cn.id)) continue;
    rows.push({
      id: `cn-${cn.id}`,
      name: cn.name,
      typeLabel: "koszt (szablon)",
      amount: 0,
      dayOfMonth: cn.defaultPaymentDayOfMonth ?? null,
      cyclicStatus: "—",
      source: "costName",
    });
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export type CyclicPaymentsPanelProps = {
  entries: BudgetEntry[];
  costNames: CostName[];
  onConfirmEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
};

export function CyclicPaymentsPanel({
  entries,
  costNames,
  onConfirmEntry,
  onDeleteEntry,
}: CyclicPaymentsPanelProps) {
  const rows = useMemo(
    () => buildCyclicRows(entries, costNames),
    [entries, costNames],
  );

  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">
        Lista płatności cyklicznych z operacji oraz szablonów nazw kosztów.
        Potwierdzenie kwoty aktualizuje status na bieżący miesiąc.
      </p>
      <div className="max-h-[min(24rem,50vh)] overflow-y-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Nazwa</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2 text-right">Kwota</th>
              <th className="px-3 py-2 text-center">Dzień miesiąca</th>
              <th className="px-3 py-2">Status potwierdzenia</th>
              <th className="px-3 py-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  Brak pozycji cyklicznych.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{row.typeLabel}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-slate-800">
                    {row.amount > 0 ? formatCurrency(row.amount) : "—"}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums text-slate-700">
                    {row.dayOfMonth ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{row.cyclicStatus}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {row.source === "entry" && row.entryId && (
                        <>
                          <button
                            type="button"
                            disabled={
                              row.cyclicStatus === "kwota potwierdzona"
                            }
                            onClick={() => onConfirmEntry(row.entryId!)}
                            className="text-xs font-medium text-sky-700 hover:underline disabled:text-slate-400 disabled:no-underline"
                          >
                            Potwierdź na ten miesiąc
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(row.entryId!)}
                            className="text-xs font-medium text-rose-700 hover:underline"
                          >
                            Usuń
                          </button>
                        </>
                      )}
                      {row.source === "costName" && (
                        <span className="text-xs text-slate-500">
                          Tylko szablon
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
