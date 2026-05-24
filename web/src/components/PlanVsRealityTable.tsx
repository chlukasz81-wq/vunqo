"use client";

import {
  buildPlanVsRealityRows,
  formatCurrency,
  formatDisplayDate,
  type DateRange,
} from "@/lib/budget-utils";
import type { BudgetEntry } from "@/data/budget-mock";
import { useMemo } from "react";

export type PlanVsRealityTableProps = {
  entries: BudgetEntry[];
  range: DateRange;
};

export function PlanVsRealityTable({ entries, range }: PlanVsRealityTableProps) {
  const rows = useMemo(
    () => buildPlanVsRealityRows(entries, range),
    [entries, range],
  );

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Plan vs rzeczywistość
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Porównanie planowanych i rzeczywistych wpływów wg dnia w wybranym
          okresie
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3 sm:px-6">Data</th>
              <th className="px-4 py-3 text-right sm:px-6">Planowane wpływy</th>
              <th className="px-4 py-3 text-right sm:px-6">Rzeczywiste wpływy</th>
              <th className="px-4 py-3 text-right sm:px-6">Różnica</th>
              <th className="px-4 py-3 text-right sm:px-6">Koszty</th>
              <th className="px-4 py-3 text-right sm:px-6">Bilans planowany</th>
              <th className="px-4 py-3 text-right sm:px-6">Bilans rzeczywisty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  Brak danych w wybranym okresie.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700 sm:px-6">
                    {formatDisplayDate(row.date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-emerald-700 sm:px-6">
                    {formatCurrency(row.plannedInflows)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-teal-700 sm:px-6">
                    {formatCurrency(row.realInflows)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums sm:px-6 ${
                      row.difference > 0
                        ? "text-rose-700"
                        : row.difference < 0
                          ? "text-emerald-700"
                          : "text-slate-600"
                    }`}
                  >
                    {row.difference === 0
                      ? formatCurrency(0)
                      : row.difference > 0
                        ? `+${formatCurrency(row.difference)}`
                        : formatCurrency(row.difference)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-rose-700 sm:px-6">
                    {formatCurrency(row.costs)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums sm:px-6 ${
                      row.plannedBalance >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {formatCurrency(row.plannedBalance)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums sm:px-6 ${
                      row.realBalance >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatCurrency(row.realBalance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
