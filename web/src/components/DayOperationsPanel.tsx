"use client";

import { useState } from "react";
import type { BudgetEntry } from "@/data/budget-mock";
import {
  formatSelectedDayDateFromIso,
  type DayTotals,
} from "@/lib/calendar-utils";
import {
  PAYMENT_STATUS_STYLES,
  buildTransferCopyText,
  formatCurrency,
  formatDisplayDate,
  formatEntryTypeLabel,
  isInflowType,
  isPlannedInflow,
  isRealInflow,
} from "@/lib/budget-utils";

export type DayOperationsPanelProps = {
  dateIso: string;
  dayEntries: BudgetEntry[];
  selectedOperation: BudgetEntry | null;
  totals?: DayTotals;
  onEditEntry: (entry: BudgetEntry) => void;
  onDeleteEntry: (id: string) => void;
  onMarkPaid: (id: string) => void;
  embedded?: boolean;
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

function OperationRowActions({
  entry,
  copied,
  onCopied,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  entry: BudgetEntry;
  copied: boolean;
  onCopied: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
}) {
  const actionClass =
    "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 select-none";

  const handleCopy = async () => {
    const text = buildTransferCopyText(entry);
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onCopied();
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      <button type="button" onClick={onEdit} className={actionClass}>
        Edytuj
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="select-none rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50"
      >
        Usuń
      </button>
      {entry.paymentStatus !== "zapłacone" && (
        <button
          type="button"
          onClick={onMarkPaid}
          className="select-none rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs font-medium text-emerald-800 shadow-sm hover:bg-emerald-50"
        >
          Oznacz jako zapłacone
        </button>
      )}
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={actionClass}
      >
        {copied ? "Skopiowano" : "Kopiuj do przelewu"}
      </button>
    </div>
  );
}

function OperationsTable({
  title,
  entries,
  copyFeedbackId,
  onCopyFeedback,
  onEditEntry,
  onDeleteEntry,
  onMarkPaid,
  showPaidDate = false,
}: {
  title: string;
  entries: BudgetEntry[];
  copyFeedbackId: string | null;
  onCopyFeedback: (id: string) => void;
  onEditEntry: (entry: BudgetEntry) => void;
  onDeleteEntry: (id: string) => void;
  onMarkPaid: (id: string) => void;
  showPaidDate?: boolean;
}) {
  const invoiceHeader =
    entries[0] && !isInflowType(entries[0].type)
      ? "Numer faktury / tytuł"
      : "Numer dokumentu / opis";

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-3 sm:px-4">Typ</th>
              <th className="px-3 py-3 sm:px-4">Nazwa</th>
              <th className="px-3 py-3 sm:px-4">Kategoria</th>
              <th className="px-3 py-3 sm:px-4 text-right">Kwota</th>
              <th className="px-3 py-3 sm:px-4">Status</th>
              <th className="px-3 py-3 sm:px-4">{invoiceHeader}</th>
              <th className="px-3 py-3 sm:px-4">Termin płatności</th>
              {showPaidDate && (
                <th className="px-3 py-3 sm:px-4">Data zapłaty</th>
              )}
              <th className="px-3 py-3 sm:px-4">Cykliczna</th>
              <th className="min-w-[12rem] px-3 py-3 sm:px-4">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={showPaidDate ? 10 : 9}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  Brak operacji.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="whitespace-nowrap px-3 py-3 sm:px-4">
                    <span
                      className={
                        entry.type === "koszt"
                          ? "font-medium text-rose-700"
                          : isRealInflow(entry.type)
                            ? "font-medium text-teal-700"
                            : "font-medium text-emerald-700"
                      }
                    >
                      {formatEntryTypeLabel(entry.type)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900 sm:px-4">
                    {entry.name}
                  </td>
                  <td className="px-3 py-3 text-slate-600 sm:px-4">
                    {entry.category || "—"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums sm:px-4 ${
                      entry.type === "koszt"
                        ? "text-rose-700"
                        : isRealInflow(entry.type)
                          ? "text-teal-700"
                          : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <StatusBadge status={entry.paymentStatus} />
                  </td>
                  <td className="max-w-[14rem] px-3 py-3 text-slate-700 sm:px-4">
                    {entry.invoiceRef?.trim() ? (
                      entry.invoiceRef
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-700 sm:px-4">
                    {formatDisplayDate(entry.dueDate)}
                    {entry.originalDueDate && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Pierwotny termin:{" "}
                        {formatDisplayDate(entry.originalDueDate)}
                      </span>
                    )}
                  </td>
                  {showPaidDate && (
                    <td className="whitespace-nowrap px-3 py-3 text-slate-700 sm:px-4">
                      {entry.paidDate ? (
                        formatDisplayDate(entry.paidDate)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 sm:px-4">
                    {entry.cyclic ? (
                      <span className="font-medium text-sky-700">Tak</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <OperationRowActions
                      entry={entry}
                      copied={copyFeedbackId === entry.id}
                      onCopied={() => onCopyFeedback(entry.id)}
                      onEdit={() => onEditEntry(entry)}
                      onDelete={() => onDeleteEntry(entry.id)}
                      onMarkPaid={() => onMarkPaid(entry.id)}
                    />
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

export function DayOperationsPanel({
  dateIso,
  dayEntries,
  selectedOperation,
  totals,
  onEditEntry,
  onDeleteEntry,
  onMarkPaid,
  embedded = false,
}: DayOperationsPanelProps) {
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const costEntries = dayEntries
    .filter((e) => e.type === "koszt")
    .sort((a, b) => a.name.localeCompare(b.name));
  const plannedIncomeEntries = dayEntries
    .filter((e) => isPlannedInflow(e.type))
    .sort((a, b) => a.name.localeCompare(b.name));
  const realIncomeEntries = dayEntries
    .filter((e) => isRealInflow(e.type))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sumCosts = costEntries.reduce((s, e) => s + e.amount, 0);
  const sumPlanned = plannedIncomeEntries.reduce((s, e) => s + e.amount, 0);
  const sumReal = realIncomeEntries.reduce((s, e) => s + e.amount, 0);
  const balance = sumPlanned + sumReal - sumCosts;
  const costsTotal = totals?.costs ?? sumCosts;
  const plannedTotal = totals?.plannedIncome ?? sumPlanned;
  const realTotal = totals?.realIncome ?? sumReal;
  const netTotal = totals?.net ?? balance;

  const isOperationView = selectedOperation != null;

  const handleCopyFeedback = (id: string) => {
    setCopyFeedbackId(id);
    window.setTimeout(
      () => setCopyFeedbackId((current) => (current === id ? null : current)),
      2000,
    );
  };

  const content = (
    <>
      <div
        className={
          embedded ? "px-4 py-2 sm:px-6" : "border-b border-slate-200 px-4 py-3 sm:px-6"
        }
      >
        <h2
          className={
            embedded
              ? "text-base font-semibold text-slate-800"
              : "text-lg font-semibold text-slate-800"
          }
        >
          {isOperationView
            ? `Szczegóły operacji: ${selectedOperation.name}`
            : `Operacje z dnia: ${formatSelectedDayDateFromIso(dateIso)}`}
        </h2>
      </div>
      <div className={embedded ? "px-4 pb-3 sm:px-6" : "px-4 py-4 sm:px-6"}>
        {!isOperationView && dayEntries.length > 0 && (
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <div>
              <dt className="inline font-medium text-slate-700">
                Suma kosztów:{" "}
              </dt>
              <dd className="inline font-semibold tabular-nums text-rose-700">
                {formatCurrency(costsTotal)}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-700">
                Planowane wpływy:{" "}
              </dt>
              <dd className="inline font-semibold tabular-nums text-emerald-700">
                {formatCurrency(plannedTotal)}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-700">
                Rzeczywiste wpływy:{" "}
              </dt>
              <dd className="inline font-semibold tabular-nums text-teal-700">
                {formatCurrency(realTotal)}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-700">
                Bilans dnia:{" "}
              </dt>
              <dd
                className={`inline font-semibold tabular-nums ${
                  netTotal >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatCurrency(netTotal)}
              </dd>
            </div>
          </dl>
        )}

        {isOperationView ? (
          <OperationsTable
            title=""
            entries={[selectedOperation]}
            copyFeedbackId={copyFeedbackId}
            onCopyFeedback={handleCopyFeedback}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
            onMarkPaid={onMarkPaid}
            showPaidDate
          />
        ) : dayEntries.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Brak operacji w tym dniu.
          </p>
        ) : (
          <>
            {costEntries.length > 0 && (
              <OperationsTable
                title="Koszty z dnia"
                entries={costEntries}
                copyFeedbackId={copyFeedbackId}
                onCopyFeedback={handleCopyFeedback}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
                onMarkPaid={onMarkPaid}
              />
            )}
            {plannedIncomeEntries.length > 0 && (
              <OperationsTable
                title="Planowane wpływy z dnia"
                entries={plannedIncomeEntries}
                copyFeedbackId={copyFeedbackId}
                onCopyFeedback={handleCopyFeedback}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
                onMarkPaid={onMarkPaid}
              />
            )}
            {realIncomeEntries.length > 0 && (
              <OperationsTable
                title="Rzeczywiste wpływy z dnia"
                entries={realIncomeEntries}
                copyFeedbackId={copyFeedbackId}
                onCopyFeedback={handleCopyFeedback}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
                onMarkPaid={onMarkPaid}
              />
            )}
          </>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="border-b border-slate-200 bg-slate-50/40">{content}</div>
    );
  }

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {content}
    </section>
  );
}

export function DayOperationsPlaceholder({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const message = (
    <p className="text-sm text-slate-600">
      Kliknij nagłówek dnia, aby zobaczyć wszystkie operacje z tego dnia, lub
      kwotę w komórce, aby zobaczyć szczegóły jednej operacji.
    </p>
  );

  if (embedded) {
    return (
      <div className="border-b border-slate-200 bg-slate-50/40 px-4 py-3 sm:px-6">
        {message}
      </div>
    );
  }

  return (
    <section className="mb-8 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 sm:px-6">
      {message}
    </section>
  );
}

export function getEntriesForCalendarDay(
  entries: BudgetEntry[],
  dateIso: string,
): BudgetEntry[] {
  return entries.filter((entry) => entry.date === dateIso);
}
