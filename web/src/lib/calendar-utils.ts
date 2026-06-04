import type { CalendarCellPayment, CalendarRow, CalendarRowType } from "@/data/calendar-mock";
import type { BudgetEntry, OperationType, PaymentStatus } from "@/data/budget-mock";
import type { DateRange, PeriodFilter } from "@/lib/budget-utils";
import {
  PAYMENT_STATUS_STYLES,
  formatCurrency,
  formatDisplayDate,
  getPeriodRange,
  parseDate,
  startOfDay,
} from "@/lib/budget-utils";
import {
  getCalendarCostRowLabel,
  getOverdueCosts,
  isOverdueCost,
} from "@/lib/overdue-utils";

export type CalendarRowFilter = "koszty" | "przychody" | "wszystko";

export interface CalendarColumn {
  iso: string;
  date: Date;
  day: number;
  month: number;
  year: number;
}

export interface DayTotals {
  dateIso: string;
  day: number;
  costs: number;
  /** Suma planowanych wpływów */
  income: number;
  plannedIncome: number;
  realIncome: number;
  net: number;
  deficit: boolean;
  paymentCount: number;
  hasOverdue: boolean;
}

/** Skrót dnia tygodnia (pon–ndz). */
const POLISH_WEEKDAY_SHORT = [
  "ndz",
  "pon",
  "wt",
  "śr",
  "czw",
  "pt",
  "sob",
] as const;

export function getBrowserToday(): Date {
  return startOfDay(new Date());
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function columnFromDate(date: Date): CalendarColumn {
  const d = startOfDay(date);
  return {
    iso: toIsoDate(d),
    date: d,
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
  };
}

export function columnsFromRange(range: DateRange): CalendarColumn[] {
  const cols: CalendarColumn[] = [];
  const cur = startOfDay(range.start);
  const end = startOfDay(range.end);
  while (cur.getTime() <= end.getTime()) {
    cols.push(columnFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return cols;
}

export function getVisibleColumnsForPeriod(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
  ref: Date = new Date(),
): CalendarColumn[] {
  const range = getPeriodRange(period, customStart, customEnd, ref);
  return columnsFromRange(range);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getPolishWeekdayShort(date: Date): string {
  return POLISH_WEEKDAY_SHORT[date.getDay()];
}

export function isWeekendColumn(column: CalendarColumn): boolean {
  const dow = column.date.getDay();
  return dow === 0 || dow === 6;
}

export function isTodayColumn(
  column: CalendarColumn,
  ref: Date = new Date(),
): boolean {
  const today = startOfDay(ref);
  return column.date.getTime() === today.getTime();
}

export function formatCalendarMonthLabel(year: number, month: number): string {
  const formatted = new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatCalendarPeriodSubtitle(
  period: PeriodFilter,
  columns: CalendarColumn[],
  ref: Date = new Date(),
): string {
  if (columns.length === 0) return "";

  const startIso = columns[0].iso;
  const endIso = columns[columns.length - 1].iso;
  const rangeLabel = `${formatDisplayDate(startIso)} — ${formatDisplayDate(endIso)}`;

  switch (period) {
    case "current-period":
      return `Aktualny okres: ${rangeLabel}`;
    case "7d":
      return `Najbliższe 7 dni: ${rangeLabel}`;
    case "15d":
      return `Najbliższe 15 dni: ${rangeLabel}`;
    case "30d":
      return `Najbliższe 30 dni: ${rangeLabel}`;
    case "current-month":
    case "month":
      return formatCalendarMonthLabel(
        startOfDay(ref).getFullYear(),
        startOfDay(ref).getMonth() + 1,
      );
    case "prev-month":
      return formatCalendarMonthLabel(columns[0].year, columns[0].month);
    case "custom":
      return `Zakres: ${rangeLabel}`;
    case "today":
      return formatSelectedDayDateFromIso(startIso);
    default:
      return rangeLabel;
  }
}

export function formatCellAmount(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u00a0|\u202f/g, " ");
}

function normalizeCell(
  value: CalendarCellPayment | CalendarCellPayment[] | undefined,
): CalendarCellPayment[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function getPaymentsForCell(
  row: CalendarRow,
  dateIso: string,
): CalendarCellPayment[] {
  return normalizeCell(row.amounts[dateIso]);
}

export function resolveCellOperationId(
  entries: BudgetEntry[],
  row: CalendarRow,
  dateIso: string,
  payments: CalendarCellPayment[],
): string | null {
  const withId = payments.find((p) => p.entryId);
  if (withId?.entryId) return withId.entryId;

  const matches = entries.filter((e) => {
    if (e.type !== row.type) return false;
    const entryLabel =
      e.type === "koszt" ? e.costName?.trim() || e.name : e.name;
    if (entryLabel !== row.label) return false;
    return e.date === dateIso;
  });
  return matches[0]?.id ?? null;
}

export function getCellAmountSum(row: CalendarRow, dateIso: string): number | null {
  const payments = getPaymentsForCell(row, dateIso);
  if (payments.length === 0) return null;
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export function getAmountForDay(row: CalendarRow, dateIso: string): number | null {
  return getCellAmountSum(row, dateIso);
}

export function getPrimaryCellStatus(
  payments: CalendarCellPayment[],
): PaymentStatus | null {
  if (payments.length === 0) return null;
  if (payments.some((p) => p.paymentStatus === "po terminie")) return "po terminie";
  if (payments.some((p) => p.paymentStatus === "do zapłaty")) return "do zapłaty";
  if (payments.some((p) => p.paymentStatus === "wymaga potwierdzenia")) {
    return "wymaga potwierdzenia";
  }
  if (payments.every((p) => p.paymentStatus === "zapłacone")) return "zapłacone";
  return payments[0].paymentStatus;
}

export function filterCalendarRows(
  rows: CalendarRow[],
  rowFilter: CalendarRowFilter,
): CalendarRow[] {
  switch (rowFilter) {
    case "koszty":
      return rows.filter((r) => r.type === "koszt");
    case "przychody":
      return rows.filter(
        (r) => r.type === "planowany wpływ" || r.type === "rzeczywisty wpływ",
      );
    default:
      return rows;
  }
}

function entryInRange(entry: BudgetEntry, range: DateRange): boolean {
  const t = parseDate(entry.date).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

function getCalendarRowType(type: OperationType): CalendarRowType | null {
  if (type === "koszt") return "koszt";
  if (type === "planowany wpływ") return "planowany wpływ";
  if (type === "rzeczywisty wpływ") return "rzeczywisty wpływ";
  return null;
}

export function buildCalendarRowsFromEntries(
  entries: BudgetEntry[],
  range: DateRange,
): CalendarRow[] {
  const byKey = new Map<string, CalendarRow>();

  for (const entry of entries) {
    if (!entryInRange(entry, range)) continue;
    const calendarType = getCalendarRowType(entry.type);
    if (!calendarType) continue;

    const rowLabel =
      calendarType === "koszt"
        ? entry.costName?.trim() || entry.name
        : entry.name;
    const key = `${calendarType}:${rowLabel}`;
    let row = byKey.get(key);
    if (!row) {
      row = {
        id: `cal-${calendarType}-${rowLabel.replace(/\s+/g, "-").toLowerCase()}`,
        label: rowLabel,
        type: calendarType,
        amounts: {},
      };
      byKey.set(key, row);
    }
    const cell: CalendarCellPayment = {
      amount: entry.amount,
      paymentStatus: isOverdueCost(entry)
        ? "po terminie"
        : entry.paymentStatus,
      entryId: entry.id,
    };
    const existing = row.amounts[entry.date];
    if (!existing) {
      row.amounts[entry.date] = cell;
    } else if (Array.isArray(existing)) {
      existing.push(cell);
    } else {
      row.amounts[entry.date] = [existing, cell];
    }
  }

  return [...byKey.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Dodaje wiersze kosztów z samymi zaległościami (poza widocznym zakresem dat). */
export function mergeOverdueCostRowsIntoCalendar(
  rows: CalendarRow[],
  entries: BudgetEntry[],
  ref: Date = new Date(),
): CalendarRow[] {
  const overdue = getOverdueCosts(entries, ref);
  const existingCostLabels = new Set(
    rows.filter((r) => r.type === "koszt").map((r) => r.label),
  );
  const extra: CalendarRow[] = [];
  for (const entry of overdue) {
    const label = getCalendarCostRowLabel(entry);
    if (existingCostLabels.has(label)) continue;
    existingCostLabels.add(label);
    extra.push({
      id: `cal-koszt-${label.replace(/\s+/g, "-").toLowerCase()}`,
      label,
      type: "koszt",
      amounts: {},
    });
  }
  if (extra.length === 0) return rows;
  return [...rows, ...extra].sort((a, b) => a.label.localeCompare(b.label, "pl"));
}

export function computeDayTotals(
  rows: CalendarRow[],
  columns: CalendarColumn[],
): DayTotals[] {
  return columns.map((column) => {
    let costs = 0;
    let plannedIncome = 0;
    let realIncome = 0;
    let paymentCount = 0;
    let hasOverdue = false;

    for (const row of rows) {
      const payments = getPaymentsForCell(row, column.iso);
      for (const p of payments) {
        paymentCount += 1;
        if (p.paymentStatus === "po terminie") hasOverdue = true;
        if (row.type === "koszt") costs += p.amount;
        else if (row.type === "planowany wpływ") plannedIncome += p.amount;
        else if (row.type === "rzeczywisty wpływ") realIncome += p.amount;
      }
    }

    const income = plannedIncome + realIncome;

    return {
      dateIso: column.iso,
      day: column.day,
      costs,
      income,
      plannedIncome,
      realIncome,
      net: income - costs,
      deficit: costs > income,
      paymentCount,
      hasOverdue,
    };
  });
}

export function sumColumn(rows: CalendarRow[], dateIso: string): number {
  return rows.reduce((sum, row) => sum + (getCellAmountSum(row, dateIso) ?? 0), 0);
}

export function formatDayDetailHeading(
  dateIso: string,
): string {
  return `Operacje z dnia: ${formatSelectedDayDateFromIso(dateIso)}`;
}

export function formatSelectedDayDateFromIso(iso: string): string {
  const date = parseDate(iso);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** @deprecated Użyj formatSelectedDayDateFromIso */
export function formatSelectedDayDate(
  day: number,
  year: number,
  month: number,
): string {
  const date = new Date(year, month - 1, day);
  return formatSelectedDayDateFromIso(toIsoDate(date));
}

export function getPaymentStatusCellClasses(
  status: PaymentStatus,
  rowType: CalendarRowType,
): string {
  if (status === "zapłacone") {
    return "bg-emerald-50/70 text-emerald-800";
  }
  if (status === "po terminie") {
    return "bg-rose-50 ring-1 ring-inset ring-rose-200 text-rose-800";
  }
  if (status === "do zapłaty") {
    return rowType === "koszt"
      ? "bg-rose-50/90 text-rose-900 font-semibold"
      : "bg-sky-50/90 text-sky-900";
  }
  if (status === "wymaga potwierdzenia") {
    return "bg-amber-50 ring-1 ring-inset ring-amber-200 text-amber-900";
  }
  if (status === "przesunięte") {
    return "bg-violet-50/80 text-violet-800";
  }
  if (status === "cykliczna potwierdzona") {
    return "bg-teal-50/80 text-teal-800";
  }
  if (rowType === "rzeczywisty wpływ") {
    return "bg-teal-50/40 text-teal-700";
  }
  return rowType === "koszt"
    ? "bg-rose-50/40 text-rose-700"
    : "bg-emerald-50/40 text-emerald-700";
}

export { formatCurrency, PAYMENT_STATUS_STYLES };
