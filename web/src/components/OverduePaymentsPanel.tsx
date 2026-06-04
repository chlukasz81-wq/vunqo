"use client";

import { useMemo, useState } from "react";
import type { BudgetEntry } from "@/data/budget-mock";
import {
  PAYMENT_STATUS_STYLES,
  buildTransferCopyText,
  formatCurrency,
  formatDisplayDate,
} from "@/lib/budget-utils";
import {
  formatOverdueDaysLabel,
  getCostDisplayName,
  getDaysOverdue,
  getOverdueCosts,
  getOverdueSummary,
  getReferenceDueDate,
} from "@/lib/overdue-utils";

export type OverduePaymentsPanelProps = {
  entries: BudgetEntry[];
  onEditEntry: (entry: BudgetEntry) => void;
  onMarkPaid: (id: string) => void;
  onMoveToToday: (entry: BudgetEntry) => void;
};

function paymentCountLabel(count: number): string {
  if (count === 1) return "1 płatność";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} płatności`;
  }
  return `${count} płatności`;
}

function StatusBadge({ status }: { status: BudgetEntry["paymentStatus"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        PAYMENT_STATUS_STYLES[status] ??
        "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

export function OverduePaymentsPanel({
  entries,
  onEditEntry,
  onMarkPaid,
  onMoveToToday,
}: OverduePaymentsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const summary = useMemo(() => getOverdueSummary(entries), [entries]);
  const overdueEntries = useMemo(() => getOverdueCosts(entries), [entries]);

  const handleCopy = async (entry: BudgetEntry) => {
    const text = buildTransferCopyText(entry);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopyFeedbackId(entry.id);
    window.setTimeout(
      () => setCopyFeedbackId((current) => (current === entry.id ? null : current)),
      2000,
    );
  };

  const actionClass =
    "rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800";

  const hasOverdue = summary.count > 0;

  return (
    <section className="mb-4">
      <div
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
          hasOverdue
            ? "border-rose-200 bg-rose-50/80 text-slate-800"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        <span className="font-semibold text-slate-900">Płatności po terminie:</span>
        {!hasOverdue ? (
          <span>Brak płatności po terminie</span>
        ) : (
          <>
            <span className="text-slate-800">
              {paymentCountLabel(summary.count)} •{" "}
              <span className="font-semibold tabular-nums text-rose-800">
                {formatCurrency(summary.totalAmount)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="ml-auto shrink-0 rounded border border-rose-300 bg-white px-2.5 py-0.5 text-xs font-medium text-rose-800 shadow-sm transition-colors hover:bg-rose-100"
            >
              {expanded ? "Ukryj listę" : "Pokaż listę"}
            </button>
          </>
        )}
      </div>

      {expanded && hasOverdue && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Nazwa</th>
                  <th className="px-3 py-2 text-right">Kwota</th>
                  <th className="px-3 py-2">Termin płatności</th>
                  <th className="px-3 py-2">Ile dni po terminie</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="min-w-[12rem] px-3 py-2">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueEntries.map((entry) => {
                  const days = getDaysOverdue(entry);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {getCostDisplayName(entry)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-rose-700">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {formatDisplayDate(getReferenceDueDate(entry))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-rose-700">
                        {formatOverdueDaysLabel(days)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={entry.paymentStatus} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => onEditEntry(entry)}
                            className={actionClass}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            onClick={() => onMarkPaid(entry.id)}
                            className="rounded border border-emerald-200 bg-white px-2 py-0.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-50"
                          >
                            Oznacz jako zapłacone
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveToToday(entry)}
                            className={actionClass}
                          >
                            Przenieś na dziś
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleCopy(entry)}
                            className={actionClass}
                          >
                            {copyFeedbackId === entry.id
                              ? "Skopiowano"
                              : "Kopiuj do przelewu"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
