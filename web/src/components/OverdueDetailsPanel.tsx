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
  formatOverdueDetailSummaryLine,
  getCostDisplayName,
  getDaysOverdue,
  getOverdueEntryDisplayLabel,
  getOverdueCosts,
  getOverdueCostsForRowLabel,
  getOverdueDetailSummary,
  getReferenceDueDate,
} from "@/lib/overdue-utils";

export type OverdueDetailsSelection =
  | { scope: "all" }
  | { scope: "row"; rowLabel: string };

export type OverdueDetailsPanelProps = {
  selection: OverdueDetailsSelection;
  entries: BudgetEntry[];
  onEditEntry: (entry: BudgetEntry) => void;
  onMarkPaid: (id: string) => void;
  onMoveToToday: (entry: BudgetEntry) => void;
  onClose?: () => void;
};

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

export function OverdueDetailsPanel({
  selection,
  entries,
  onEditEntry,
  onMarkPaid,
  onMoveToToday,
  onClose,
}: OverdueDetailsPanelProps) {
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const overdueEntries = useMemo(() => {
    if (selection.scope === "all") return getOverdueCosts(entries);
    return getOverdueCostsForRowLabel(entries, selection.rowLabel);
  }, [entries, selection]);

  const summary = useMemo(
    () => getOverdueDetailSummary(overdueEntries),
    [overdueEntries],
  );

  const title =
    selection.scope === "all"
      ? "Wszystkie zaległości"
      : `Zaległości: ${selection.rowLabel}`;

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

  return (
    <div className="border-b border-rose-100 bg-rose-50/40 px-4 py-3 sm:px-6">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            {formatOverdueDetailSummaryLine(summary)}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Zamknij
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Nazwa / kontrahent</th>
              <th className="px-3 py-2">Kategoria</th>
              <th className="px-3 py-2 text-right">Kwota</th>
              <th className="px-3 py-2">Termin płatności</th>
              <th className="px-3 py-2">Ile dni po terminie</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Numer faktury / tytuł</th>
              <th className="min-w-[12rem] px-3 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {overdueEntries.map((entry) => {
              const days = getDaysOverdue(entry);
              const displayLabel = getOverdueEntryDisplayLabel(entry);
              const contractor = getCostDisplayName(entry);
              return (
                <tr
                  key={entry.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  onClick={() => onEditEntry(entry)}
                >
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {displayLabel}
                    {(selection.scope === "all" ||
                      displayLabel !== contractor) && (
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">
                        {contractor}
                      </span>
                    )}
                    {entry.originalDueDate && (
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">
                        Pierwotny termin płatności:{" "}
                        {formatDisplayDate(entry.originalDueDate)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {entry.category || "—"}
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
                  <td className="max-w-[12rem] truncate px-3 py-2 text-slate-700">
                    {entry.invoiceRef?.trim() || "—"}
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
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
  );
}
