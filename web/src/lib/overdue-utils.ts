import type { BudgetEntry } from "@/data/budget-mock";
import {
  formatCurrency,
  formatDisplayDate,
  parseDate,
  setEntryPaymentStatus,
  startOfDay,
  todayIso,
} from "@/lib/budget-utils";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isPaidCost(entry: BudgetEntry): boolean {
  if (entry.type !== "koszt") return false;
  return entry.paymentStatus === "zapłacone" || Boolean(entry.paidDate);
}

export function getReferenceDueDate(entry: BudgetEntry): string {
  return entry.originalDueDate ?? entry.dueDate;
}

export function getDaysOverdue(
  entry: BudgetEntry,
  ref: Date = new Date(),
): number {
  if (entry.type !== "koszt" || isPaidCost(entry)) return 0;
  const due = startOfDay(parseDate(getReferenceDueDate(entry)));
  const today = startOfDay(ref);
  if (due.getTime() >= today.getTime()) return 0;
  return Math.round((today.getTime() - due.getTime()) / MS_PER_DAY);
}

export function isOverdueCost(
  entry: BudgetEntry,
  ref: Date = new Date(),
): boolean {
  return getDaysOverdue(entry, ref) > 0;
}

export function getOverdueCosts(
  entries: BudgetEntry[],
  ref: Date = new Date(),
): BudgetEntry[] {
  return entries
    .filter((e) => isOverdueCost(e, ref))
    .sort((a, b) => {
      const dueDiff =
        parseDate(getReferenceDueDate(a)).getTime() -
        parseDate(getReferenceDueDate(b)).getTime();
      if (dueDiff !== 0) return dueDiff;
      return a.name.localeCompare(b.name, "pl");
    });
}

export interface OverdueSummary {
  count: number;
  totalAmount: number;
  oldest: BudgetEntry | null;
  oldestDaysOverdue: number;
}

export function getOverdueSummary(
  entries: BudgetEntry[],
  ref: Date = new Date(),
): OverdueSummary {
  const overdue = getOverdueCosts(entries, ref);
  const totalAmount = overdue.reduce((sum, e) => sum + e.amount, 0);
  const oldest = overdue[0] ?? null;
  return {
    count: overdue.length,
    totalAmount,
    oldest,
    oldestDaysOverdue: oldest ? getDaysOverdue(oldest, ref) : 0,
  };
}

export function getCostDisplayName(entry: BudgetEntry): string {
  return entry.costName?.trim() || entry.name;
}

/** Etykieta wiersza na liście zaległości (faktura / tytuł lub nazwa). */
export function getOverdueEntryDisplayLabel(entry: BudgetEntry): string {
  return entry.invoiceRef?.trim() || entry.name;
}

/**
 * Po zapisie edycji kosztu: zachowaj pierwotny termin przy przeniesieniu z zaległości na dziś,
 * ustaw datę operacji w kalendarzu na dziś, gdy termin płatności = dziś.
 */
export function normalizeCostEntryOnSave(
  updated: BudgetEntry,
  previous: BudgetEntry,
  ref: Date = new Date(),
): BudgetEntry {
  if (updated.type !== "koszt") {
    return setEntryPaymentStatus(updated, updated.paymentStatus, ref);
  }

  let entry = setEntryPaymentStatus({ ...updated }, updated.paymentStatus, ref);
  const today = todayIso(ref);
  const todayStart = startOfDay(ref);
  const prevDue = previous.dueDate;
  const newDue = entry.dueDate;
  const wasOverdue = getDaysOverdue(previous, ref) > 0;
  const newDueStart = startOfDay(parseDate(newDue));
  const movedOffOverdue =
    wasOverdue && newDueStart.getTime() >= todayStart.getTime();

  if (movedOffOverdue) {
    entry = {
      ...entry,
      originalDueDate: previous.originalDueDate ?? prevDue,
    };
    if (newDue === today) {
      entry = {
        ...entry,
        date: today,
        paymentStatus:
          entry.paymentStatus === "po terminie"
            ? "przesunięte"
            : entry.paymentStatus,
      };
    }
  } else if (
    !isPaidCost(entry) &&
    newDue === today &&
    startOfDay(parseDate(entry.date)).getTime() < todayStart.getTime()
  ) {
    entry = {
      ...entry,
      date: today,
      originalDueDate: previous.originalDueDate ?? prevDue,
    };
  }

  return entry;
}

/** Etykieta wiersza kalendarza dla kosztu (źródło / kontrahent). */
export function getCalendarCostRowLabel(entry: BudgetEntry): string {
  return getCostDisplayName(entry);
}

export function getOverdueCostsForRowLabel(
  entries: BudgetEntry[],
  rowLabel: string,
  ref: Date = new Date(),
): BudgetEntry[] {
  return getOverdueCosts(entries, ref).filter(
    (e) => getCalendarCostRowLabel(e) === rowLabel,
  );
}

export function sumOverdueAmount(overdue: BudgetEntry[]): number {
  return overdue.reduce((sum, e) => sum + e.amount, 0);
}

function paymentCountWord(count: number): string {
  if (count === 1) return "płatność";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "płatności";
  }
  return "płatności";
}

export function getOverdueRowColumnTooltip(
  rowLabel: string,
  entries: BudgetEntry[],
  ref: Date = new Date(),
): string | null {
  const rowOverdue = getOverdueCostsForRowLabel(entries, rowLabel, ref);
  if (rowOverdue.length === 0) return null;
  const total = sumOverdueAmount(rowOverdue);
  const count = rowOverdue.length;
  return `${rowLabel} — ${formatCurrency(total)} zaległości — ${count} ${paymentCountWord(count)}`;
}

export function getOverdueTotalColumnTooltip(
  entries: BudgetEntry[],
  ref: Date = new Date(),
): string | null {
  const overdue = getOverdueCosts(entries, ref);
  if (overdue.length === 0) return null;
  const total = sumOverdueAmount(overdue);
  const count = overdue.length;
  return `Wszystkie zaległości — ${formatCurrency(total)} — ${count} ${paymentCountWord(count)}`;
}

export interface OverdueDetailSummary {
  count: number;
  totalAmount: number;
  oldestDueDate: string | null;
  largestAmount: number;
}

export function getOverdueDetailSummary(
  overdue: BudgetEntry[],
): OverdueDetailSummary {
  if (overdue.length === 0) {
    return { count: 0, totalAmount: 0, oldestDueDate: null, largestAmount: 0 };
  }
  const totalAmount = sumOverdueAmount(overdue);
  const oldestDueDate = getReferenceDueDate(overdue[0]);
  const largestAmount = overdue.reduce(
    (max, e) => (e.amount > max ? e.amount : max),
    0,
  );
  return {
    count: overdue.length,
    totalAmount,
    oldestDueDate,
    largestAmount,
  };
}

export function formatOverdueDetailSummaryLine(
  summary: OverdueDetailSummary,
): string {
  if (summary.count === 0) return "Brak zaległości";
  const parts: string[] = [
    summary.count === 1 ? "1 płatność" : `${summary.count} płatności`,
    formatCurrency(summary.totalAmount),
  ];
  if (summary.oldestDueDate) {
    parts.push(`najstarsza ${formatDisplayDate(summary.oldestDueDate)}`);
  }
  if (summary.count > 1 && summary.largestAmount > 0) {
    parts.push(`największa ${formatCurrency(summary.largestAmount)}`);
  }
  return parts.join(" • ");
}

export function getOverdueAmountTooltip(
  entry: BudgetEntry,
  ref: Date = new Date(),
): string | null {
  if (entry.type !== "koszt" || isPaidCost(entry)) return null;
  const days = getDaysOverdue(entry, ref);
  if (days <= 0) return null;

  const name = getCostDisplayName(entry);
  const amount = formatCurrency(entry.amount);

  if (entry.originalDueDate) {
    const originalLabel = formatDisplayDate(entry.originalDueDate);
    return `${name} — ${amount} — Pierwotnie termin: ${originalLabel}, ${days} dni po terminie`;
  }

  return `${name} — ${amount} — ${days} dni po terminie`;
}

export function movePaymentToToday(
  entry: BudgetEntry,
  ref: Date = new Date(),
): BudgetEntry {
  const today = toIso(startOfDay(ref));
  const previousDue = entry.dueDate;
  return {
    ...entry,
    date: today,
    dueDate: today,
    originalDueDate: entry.originalDueDate ?? previousDue,
    paymentStatus: "przesunięte",
    paidDate: undefined,
  };
}

export function formatOverdueDaysLabel(days: number): string {
  if (days === 1) return "1 dzień po terminie";
  return `${days} dni po terminie`;
}
