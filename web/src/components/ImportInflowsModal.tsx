"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  MOCK_STATEMENT_IMPORT_INFLOWS,
  effectiveImportStatus,
  type PendingInflow,
  type RejectedInflow,
} from "@/data/pending-inflows-mock";
import type { BudgetEntry } from "@/data/budget-mock";
import { formatCurrency, formatDisplayDate } from "@/lib/budget-utils";
import {
  filterRowsByDateRange,
  parseBankCsv,
  parsedRowsToPendingTemplates,
} from "@/lib/csv-parse";
import { prepareImportedPendingInflows } from "@/lib/pending-inflow-utils";

export type ImportInflowsModalProps = {
  portalReady: boolean;
  existingPending: PendingInflow[];
  entries: BudgetEntry[];
  rejected: RejectedInflow[];
  onClose: () => void;
  onConfirm: (prepared: PendingInflow[]) => void;
};

const IMPORT_STATUS_STYLES: Record<string, string> = {
  nowy: "bg-slate-100 text-slate-700 ring-slate-200",
  "prawdopodobny duplikat": "bg-amber-50 text-amber-900 ring-amber-200",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

const TEST_MODE_BANNER =
  "To jest obecnie tryb testowy. Dane z pliku nie są jeszcze realnie odczytywane. System pokazuje przykładowy podgląd importu.";

type LoadStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "parsed"; fileName: string }
  | { kind: "fallback"; fileName: string };

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsText(file, "UTF-8");
  });
}

export function ImportInflowsModal({
  portalReady,
  existingPending,
  entries,
  rejected,
  onClose,
  onConfirm,
}: ImportInflowsModalProps) {
  const [bankAccount, setBankAccount] = useState("mBank");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [positiveOnly, setPositiveOnly] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [parseNotice, setParseNotice] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>({ kind: "idle" });
  const [preview, setPreview] = useState<PendingInflow[] | null>(null);

  useEffect(() => {
    if (!portalReady) return;
    setBankAccount("mBank");
    setDateFrom("");
    setDateTo("");
    setPositiveOnly(true);
    setFile(null);
    setFileError("");
    setParseNotice(null);
    setLoadStatus({ kind: "idle" });
    setPreview(null);
  }, [portalReady]);

  if (!portalReady) return null;

  const isTestFallback = loadStatus.kind === "fallback";
  const isLoading = loadStatus.kind === "loading";

  const handleLoad = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFileError("Wybierz plik CSV lub Excel.");
      return;
    }
    setFileError("");
    setParseNotice(null);
    setPreview(null);
    setLoadStatus({ kind: "loading" });

    const bank = bankAccount.trim() || "mBank";
    let templates: Omit<PendingInflow, "id">[] = [];
    let usedFallback = false;

    try {
      const text = await readFileAsText(file);
      const parsed = parseBankCsv(text);

      if (parsed.ok) {
        let rows = parsed.rows;
        if (dateFrom && dateTo) {
          rows = filterRowsByDateRange(rows, dateFrom, dateTo);
        }
        templates = parsedRowsToPendingTemplates(rows, bank);
        setLoadStatus({ kind: "parsed", fileName: file.name });
      } else {
        usedFallback = true;
        setParseNotice(
          "Nie udało się odczytać pliku. Pokazuję przykładowe dane testowe.",
        );
        templates = MOCK_STATEMENT_IMPORT_INFLOWS.map((row) => ({
          ...row,
          source: bank || row.source,
        }));
        setLoadStatus({ kind: "fallback", fileName: file.name });
      }
    } catch {
      usedFallback = true;
      setParseNotice(
        "Nie udało się odczytać pliku. Pokazuję przykładowe dane testowe.",
      );
      templates = MOCK_STATEMENT_IMPORT_INFLOWS.map((row) => ({
        ...row,
        source: bank || row.source,
      }));
      setLoadStatus({ kind: "fallback", fileName: file.name });
    }

    if (positiveOnly) {
      templates = templates.filter((row) => row.amount > 0);
    }

    const prepared = prepareImportedPendingInflows(
      templates,
      existingPending,
      entries,
      rejected,
    );

    setPreview(prepared);
  };

  const handleConfirm = () => {
    if (!preview || preview.length === 0) return;
    onConfirm(preview);
  };

  const statusMessage = (() => {
    switch (loadStatus.kind) {
      case "loading":
        return "Odczytuję plik...";
      case "parsed":
        return `Wczytano dane z pliku: ${loadStatus.fileName}`;
      case "fallback":
        return "Tryb testowy — pokazano przykładowe dane, plik nie został jeszcze realnie przetworzony.";
      default:
        return null;
    }
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="my-4 w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-inflows-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3
          id="import-inflows-title"
          className="mb-4 text-lg font-semibold text-slate-900"
        >
          Import wpływów z wyciągu bankowego
        </h3>

        <form onSubmit={(e) => void handleLoad(e)} className="space-y-4">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Plik CSV / Excel
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className={inputClass}
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                setFile(next);
                if (next) setFileError("");
                setPreview(null);
                setParseNotice(null);
                setLoadStatus({ kind: "idle" });
              }}
            />
            {fileError ? (
              <span className="text-xs text-rose-600">{fileError}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Bank / konto
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              className={inputClass}
              placeholder="mBank"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={positiveOnly}
              onChange={(e) => setPositiveOnly(e.target.checked)}
              className="rounded border-slate-300 text-sky-600"
            />
            Importuj tylko wpływy dodatnie
          </label>

          <details className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Opcjonalnie filtruj daty
            </summary>
            <div className="mt-3 space-y-3">
              <p className="text-xs text-slate-600">
                System powinien odczytać daty z pliku. Zakres dat służy tylko do
                filtrowania wyników, nie jest wymagany.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  od daty
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  do daty
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </details>

          {parseNotice ? (
            <p className="text-sm text-amber-800">{parseNotice}</p>
          ) : null}

          {isTestFallback ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {TEST_MODE_BANNER}
            </p>
          ) : null}

          {statusMessage ? (
            <p
              className={`flex items-center gap-2 text-sm font-medium ${
                isLoading
                  ? "text-slate-700"
                  : isTestFallback
                    ? "text-amber-800"
                    : "text-emerald-800"
              }`}
            >
              {isLoading ? (
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600"
                  aria-hidden
                />
              ) : null}
              {statusMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={!file || isLoading}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Wczytaj wyciąg
            </button>
          </div>
        </form>

        {preview && preview.length > 0 ? (
          <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-800">
              Podgląd importu
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Opis z wyciągu</th>
                    <th className="px-3 py-2 text-right">Kwota</th>
                    <th className="px-3 py-2">Źródło/nadawca</th>
                    <th className="px-3 py-2">Status importu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.map((row) => {
                    const status = effectiveImportStatus(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {formatDisplayDate(row.date)}
                        </td>
                        <td className="max-w-[14rem] px-3 py-2 font-medium text-slate-900">
                          {row.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-emerald-700">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.source}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${IMPORT_STATUS_STYLES[status] ?? IMPORT_STATUS_STYLES.nowy}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Dodaj do akceptacji
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
