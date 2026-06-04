import {
  REFERENCE_DATE,
  type BudgetEntry,
  type CyclicFrequency,
  type OperationType,
  type PaymentStatus,
} from "@/data/budget-mock";
import type { PendingInflow } from "@/data/pending-inflows-mock";

export type PeriodFilter =
  | "today"
  | "7d"
  | "15d"
  | "30d"
  | "current-period"
  /** @deprecated alias — use current-month */
  | "month"
  | "current-month"
  | "prev-month"
  | "custom";

export const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "today", label: "Dziś" },
  { value: "7d", label: "7 dni" },
  { value: "15d", label: "15 dni" },
  { value: "30d", label: "30 dni" },
  { value: "current-period", label: "Aktualny okres" },
  { value: "current-month", label: "Bieżący miesiąc" },
  { value: "prev-month", label: "Poprzedni miesiąc" },
  { value: "custom", label: "Własny zakres dat" },
];

export type PaymentStatusFilter =
  | "wszystkie"
  | "do zapłaty"
  | "zapłacone"
  | "po terminie"
  | "cykliczne"
  | "wymaga potwierdzenia";

export type OperationTypeFilter = "wszystko" | OperationType;

/** @deprecated Użyj OperationTypeFilter */
export type EntryTypeFilter = OperationTypeFilter;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TableRow extends BudgetEntry {
  dailyBalance: number;
}

export interface PlanVsRealityRow {
  date: string;
  plannedInflows: number;
  realInflows: number;
  difference: number;
  costs: number;
  plannedBalance: number;
  realBalance: number;
}

export const ALL_OPERATION_TYPES: OperationType[] = [
  "koszt",
  "planowany wpływ",
  "wpływ do akceptacji",
  "rzeczywisty wpływ",
];

export const ALL_PAYMENT_STATUSES: PaymentStatus[] = [
  "do zapłaty",
  "zapłacone",
  "po terminie",
  "przesunięte",
  "wymaga potwierdzenia",
  "cykliczna potwierdzona",
];

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  zapłacone: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "do zapłaty": "bg-sky-50 text-sky-800 ring-sky-200",
  "po terminie": "bg-rose-50 text-rose-800 ring-rose-200",
  "wymaga potwierdzenia": "bg-amber-50 text-amber-800 ring-amber-200",
  przesunięte: "bg-violet-50 text-violet-800 ring-violet-200",
  "cykliczna potwierdzona": "bg-teal-50 text-teal-800 ring-teal-200",
};

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function parseDate(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD for input type="date" using the browser's local today. */
export function getTodayDateInputValue(): string {
  return toIso(new Date());
}

/** YYYY-MM-DD for the first day of the current local month. */
export function getFirstDayOfCurrentMonthInputValue(): string {
  const d = new Date();
  return toIso(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  const normalized = formatted.replace(/\u00a0|\u202f/g, " ");
  return `${amount < 0 ? "−" : ""}${normalized} zł`;
}

export function formatDisplayDate(iso: string): string {
  const d = parseDate(iso);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(iso: string): string {
  const d = parseDate(iso);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function getPeriodRange(
  period: PeriodFilter,
  customStart?: string,
  customEnd?: string,
  ref: Date = new Date(),
): DateRange {
  const today = startOfDay(ref);

  switch (period) {
    case "today":
      return { start: today, end: today };
    case "7d":
      return { start: today, end: addDays(today, 6) };
    case "15d":
      return { start: today, end: addDays(today, 14) };
    case "30d":
    case "current-period":
      return { start: today, end: addDays(today, 29) };
    case "month":
    case "current-month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start, end };
    }
    case "prev-month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start, end };
    }
    case "custom": {
      const start = customStart
        ? startOfDay(parseDate(customStart))
        : addDays(today, -29);
      const end = customEnd ? startOfDay(parseDate(customEnd)) : today;
      if (start > end) return { start: end, end: start };
      return { start, end };
    }
    default:
      return { start: today, end: today };
  }
}

export function isDateInRange(iso: string, range: DateRange): boolean {
  const d = parseDate(iso).getTime();
  return d >= range.start.getTime() && d <= range.end.getTime();
}

export function filterEntriesByPeriod(
  entries: BudgetEntry[],
  range: DateRange,
): BudgetEntry[] {
  return entries
    .filter((e) => isDateInRange(e.date, range))
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

export function matchesPaymentStatusFilter(
  entry: BudgetEntry,
  filter: PaymentStatusFilter,
): boolean {
  switch (filter) {
    case "wszystkie":
      return true;
    case "do zapłaty":
      return entry.paymentStatus === "do zapłaty";
    case "zapłacone":
      return entry.paymentStatus === "zapłacone";
    case "po terminie":
      return entry.paymentStatus === "po terminie";
    case "cykliczne":
      return entry.cyclic;
    case "wymaga potwierdzenia":
      return entry.paymentStatus === "wymaga potwierdzenia";
    default:
      return true;
  }
}

export function formatAmountForClipboard(amount: number): string {
  if (Number.isInteger(amount)) return String(amount);
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function buildEditModalTransferCopyText(params: {
  name: string;
  invoiceRef?: string;
  amount: number;
  dueDate: string;
}): string {
  const lines = [`Nazwa: ${params.name.trim()}`];
  const ref = params.invoiceRef?.trim();
  if (ref) lines.push(`Tytuł: ${ref}`);
  lines.push(`Kwota: ${formatAmountForClipboard(params.amount)} zł`);
  lines.push(`Termin płatności: ${formatDisplayDate(params.dueDate)}`);
  return lines.join("\n");
}

export async function copyTextToClipboard(text: string): Promise<void> {
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
}

export function buildTransferCopyText(entry: BudgetEntry): string {
  const amount = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(entry.amount);
  const due = formatDisplayDate(entry.dueDate);
  const ref = entry.invoiceRef?.trim();
  const parts = ref
    ? [entry.name, ref, `${amount} zł`, `termin ${due}`]
    : [entry.name, `${amount} zł`, `termin ${due}`];
  return parts.join(" | ");
}

export function isInflowType(type: OperationType): boolean {
  return type !== "koszt";
}

export function isPlannedInflow(type: OperationType): boolean {
  return type === "planowany wpływ";
}

export function isRealInflow(type: OperationType): boolean {
  return type === "rzeczywisty wpływ";
}

export function migrateOperationType(raw: unknown): OperationType | null {
  if (raw === "koszt") return "koszt";
  if (raw === "przychód" || raw === "planowany wpływ") return "planowany wpływ";
  if (raw === "rzeczywisty wpływ") return "rzeczywisty wpływ";
  if (raw === "wpływ do akceptacji") return "wpływ do akceptacji";
  return null;
}

export function formatOperationTypeLabel(type: OperationType): string {
  switch (type) {
    case "koszt":
      return "koszt";
    case "planowany wpływ":
      return "planowany przychód";
    case "rzeczywisty wpływ":
      return "rzeczywisty wpływ";
    case "wpływ do akceptacji":
      return "wpływ do akceptacji";
    default:
      return type;
  }
}

/** @deprecated Użyj formatOperationTypeLabel */
export const formatEntryTypeLabel = formatOperationTypeLabel;

export function operationTypeColorClass(type: OperationType): string {
  if (type === "koszt") return "text-rose-700";
  if (type === "rzeczywisty wpływ") return "text-teal-700";
  if (type === "wpływ do akceptacji") return "text-amber-700";
  return "text-emerald-700";
}

export function matchesOperationTypeFilter(
  entry: BudgetEntry,
  filter: OperationTypeFilter,
): boolean {
  if (filter === "wszystko") return true;
  return entry.type === filter;
}

/** @deprecated Użyj matchesOperationTypeFilter */
export const matchesEntryTypeFilter = matchesOperationTypeFilter;

export function matchesCategoryFilter(
  entry: BudgetEntry,
  categoryName: string | undefined,
): boolean {
  if (!categoryName) return true;
  return entry.category === categoryName;
}

export function matchesCostNameFilter(
  entry: BudgetEntry,
  costNameFilter: string | undefined,
): boolean {
  if (!costNameFilter) return true;
  const label = entry.costName?.trim() || entry.name;
  return label === costNameFilter;
}

export function filterHistoriaEntries(
  entries: BudgetEntry[],
  options: {
    specificDay?: string;
    dateFrom?: string;
    dateTo?: string;
    periodRange: DateRange;
    paymentStatus: PaymentStatusFilter;
    entryType: OperationTypeFilter;
    category?: string;
    costName?: string;
  },
): BudgetEntry[] {
  let dateRange: DateRange;
  if (options.specificDay) {
    const day = startOfDay(parseDate(options.specificDay));
    dateRange = { start: day, end: day };
  } else if (options.dateFrom || options.dateTo) {
    const start = options.dateFrom
      ? startOfDay(parseDate(options.dateFrom))
      : options.periodRange.start;
    const end = options.dateTo
      ? startOfDay(parseDate(options.dateTo))
      : options.periodRange.end;
    if (start > end) {
      dateRange = { start: end, end: start };
    } else {
      dateRange = { start, end };
    }
  } else {
    dateRange = options.periodRange;
  }

  return sortEntries(
    entries.filter(
      (e) =>
        isDateInRange(e.date, dateRange) &&
        matchesPaymentStatusFilter(e, options.paymentStatus) &&
        matchesOperationTypeFilter(e, options.entryType) &&
        (!options.category || e.category === options.category) &&
        matchesCostNameFilter(e, options.costName),
    ),
  );
}

export function todayIso(ref: Date = REFERENCE_DATE): string {
  return toIso(startOfDay(ref));
}

export function applyPaidStatus(
  entry: BudgetEntry,
  ref: Date = REFERENCE_DATE,
): BudgetEntry {
  const paid = todayIso(ref);
  return {
    ...entry,
    paymentStatus: "zapłacone",
    paidDate: entry.paidDate ?? paid,
  };
}

export function applyUnpaidStatus(entry: BudgetEntry): BudgetEntry {
  const { paidDate: _removed, ...rest } = entry;
  return { ...rest, paymentStatus: "do zapłaty" };
}

export function setEntryPaymentStatus(
  entry: BudgetEntry,
  status: PaymentStatus,
  ref: Date = REFERENCE_DATE,
): BudgetEntry {
  if (status === "zapłacone") {
    return applyPaidStatus({ ...entry, paymentStatus: status }, ref);
  }
  if (status === "do zapłaty") {
    return applyUnpaidStatus({ ...entry, paymentStatus: status });
  }
  const { paidDate: _removed, ...rest } = entry;
  return { ...rest, paymentStatus: status };
}

export function getPeriodHint(
  period: PeriodFilter,
  range: DateRange,
): string {
  if (period === "custom") {
    return `${formatDisplayDate(toIso(range.start))} – ${formatDisplayDate(toIso(range.end))}`;
  }
  return `${formatDisplayDate(toIso(range.start))} – ${formatDisplayDate(toIso(range.end))}`;
}

function signedAmount(entry: BudgetEntry): number {
  return entry.type === "koszt" ? -entry.amount : entry.amount;
}

export function sumByType(
  entries: BudgetEntry[],
  type: OperationType,
): number {
  return entries
    .filter((e) => e.type === type)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function sumCosts(entries: BudgetEntry[]): number {
  return sumByType(entries, "koszt");
}

export function sumPlannedInflows(entries: BudgetEntry[]): number {
  return sumByType(entries, "planowany wpływ");
}

export function sumRealInflows(entries: BudgetEntry[]): number {
  return sumByType(entries, "rzeczywisty wpływ");
}

/** @deprecated Użyj sumPlannedInflows */
export function sumIncome(entries: BudgetEntry[]): number {
  return sumPlannedInflows(entries);
}

export function sumPlanVsRealDifference(entries: BudgetEntry[]): number {
  return sumPlannedInflows(entries) - sumRealInflows(entries);
}

export function getPlannedBalance(entries: BudgetEntry[]): number {
  return sumPlannedInflows(entries) - sumCosts(entries);
}

export function getRealBalance(entries: BudgetEntry[]): number {
  return sumRealInflows(entries) - sumCosts(entries);
}

/** @deprecated Użyj getPlannedBalance */
export function getBalance(entries: BudgetEntry[]): number {
  return getPlannedBalance(entries);
}

export function getCostsToday(
  entries: BudgetEntry[],
  ref: Date = REFERENCE_DATE,
): number {
  const iso = toIso(startOfDay(ref));
  return entries
    .filter((e) => e.type === "koszt" && e.date === iso)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getCostsNext15Days(
  entries: BudgetEntry[],
  ref: Date = REFERENCE_DATE,
): number {
  const start = startOfDay(ref);
  const end = addDays(start, 15);
  return entries
    .filter(
      (e) =>
        e.type === "koszt" &&
        parseDate(e.date).getTime() >= start.getTime() &&
        parseDate(e.date).getTime() <= end.getTime(),
    )
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getCostsTodayInFiltered(
  entries: BudgetEntry[],
  ref: Date = REFERENCE_DATE,
): number {
  return getCostsToday(entries, ref);
}

export function getCostsNext15InFiltered(
  entries: BudgetEntry[],
  ref: Date = REFERENCE_DATE,
): number {
  return getCostsNext15Days(entries, ref);
}

export function getDailyBalances(entries: BudgetEntry[]): Map<string, number> {
  const byDay = new Map<string, number>();

  for (const entry of entries) {
    const prev = byDay.get(entry.date) ?? 0;
    byDay.set(entry.date, prev + signedAmount(entry));
  }

  return byDay;
}

export function buildTableRows(
  entries: BudgetEntry[],
  balanceSource?: BudgetEntry[],
): TableRow[] {
  const balances = getDailyBalances(balanceSource ?? entries);
  return entries.map((entry) => ({
    ...entry,
    dailyBalance: balances.get(entry.date) ?? 0,
  }));
}

export function buildPlanVsRealityRows(
  entries: BudgetEntry[],
  range: DateRange,
): PlanVsRealityRow[] {
  const periodEntries = filterEntriesByPeriod(entries, range);
  const dates = new Set<string>();
  for (const e of periodEntries) dates.add(e.date);

  const start = range.start.getTime();
  const end = range.end.getTime();
  for (let t = start; t <= end; t += 86400000) {
    dates.add(toIso(new Date(t)));
  }

  const sortedDates = [...dates].sort();
  return sortedDates.map((date) => {
    const dayEntries = periodEntries.filter((e) => e.date === date);
    const plannedInflows = sumPlannedInflows(dayEntries);
    const realInflows = sumRealInflows(dayEntries);
    const costs = sumCosts(dayEntries);
    return {
      date,
      plannedInflows,
      realInflows,
      difference: plannedInflows - realInflows,
      costs,
      plannedBalance: plannedInflows - costs,
      realBalance: realInflows - costs,
    };
  });
}

export function pendingInflowToEntry(pending: PendingInflow): BudgetEntry {
  return {
    id: createEntryId(),
    date: pending.date,
    name: pending.name,
    category: pending.category,
    type: "rzeczywisty wpływ",
    amount: pending.amount,
    cyclic: false,
    paymentStatus: "zapłacone",
    invoiceRef: `${pending.source} — ${pending.name}`,
    dueDate: pending.date,
    paidDate: pending.date,
  };
}

export function defaultCustomRange(ref: Date = new Date()): {
  start: string;
  end: string;
} {
  const end = startOfDay(ref);
  const start = addDays(end, -29);
  return { start: toIso(start), end: toIso(end) };
}

export function sortEntries(entries: BudgetEntry[]): BudgetEntry[] {
  return [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
  );
}

export function createEntryId(): string {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createCategoryId(): string {
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPendingInflowId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Migruje wpisy z localStorage (przychód → planowany wpływ). */
export function migrateLegacyEntry(value: unknown): BudgetEntry | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.id !== "string" ||
    typeof raw.date !== "string" ||
    typeof raw.name !== "string" ||
    typeof raw.category !== "string" ||
    typeof raw.amount !== "number" ||
    Number.isNaN(raw.amount) ||
    typeof raw.cyclic !== "boolean"
  ) {
    return null;
  }

  const operationType = migrateOperationType(raw.type);
  if (!operationType) return null;

  const legacyStatus = raw.status as string | undefined;
  const paymentStatus =
    (raw.paymentStatus as PaymentStatus | undefined) ??
    mapLegacyStatus(legacyStatus, Boolean(raw.cyclic));

  return {
    id: raw.id,
    date: raw.date,
    name: raw.name,
    costName:
      typeof raw.costName === "string" ? raw.costName : undefined,
    costNameId:
      typeof raw.costNameId === "string" ? raw.costNameId : undefined,
    incomeSourceId:
      typeof raw.incomeSourceId === "string" ? raw.incomeSourceId : undefined,
    category: raw.category,
    type: operationType,
    amount: raw.amount,
    cyclic: raw.cyclic,
    cyclicStatus: raw.cyclicStatus as BudgetEntry["cyclicStatus"],
    cyclicFrequency: isCyclicFrequency(raw.cyclicFrequency)
      ? raw.cyclicFrequency
      : Boolean(raw.cyclic)
        ? "co miesiąc"
        : undefined,
    paymentStatus,
    invoiceRef:
      typeof raw.invoiceRef === "string" ? raw.invoiceRef : "",
    dueDate: typeof raw.dueDate === "string" ? raw.dueDate : raw.date,
    paidDate:
      typeof raw.paidDate === "string"
        ? raw.paidDate
        : legacyStatus === "opłacona"
          ? raw.date
          : undefined,
    originalDueDate:
      typeof raw.originalDueDate === "string"
        ? raw.originalDueDate
        : undefined,
  };
}

function isCyclicFrequency(value: unknown): value is CyclicFrequency {
  return (
    value === "co miesiąc" ||
    value === "co tydzień" ||
    value === "co rok" ||
    value === "własna"
  );
}

function mapLegacyStatus(
  status: string | undefined,
  cyclic: boolean,
): PaymentStatus {
  if (status === "opłacona") return "zapłacone";
  if (status === "oczekująca") return "wymaga potwierdzenia";
  if (cyclic) return "cykliczna potwierdzona";
  return "do zapłaty";
}
