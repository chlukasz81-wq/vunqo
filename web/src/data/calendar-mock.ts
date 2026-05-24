/** Kalendarz płatności — czerwiec 2026 (mock osobny od tabeli budżetu). */

import type { PaymentStatus } from "@/data/budget-mock";

export type CalendarRowType = "koszt" | "planowany wpływ" | "rzeczywisty wpływ";

export interface CalendarCellPayment {
  amount: number;
  paymentStatus: PaymentStatus;
  /** Id operacji budżetu — ustawiane przy budowaniu siatki z wpisów. */
  entryId?: string;
}

export interface CalendarRow {
  id: string;
  label: string;
  type: CalendarRowType;
  /** Data YYYY-MM-DD → jedna lub wiele płatności */
  amounts: Partial<Record<string, CalendarCellPayment | CalendarCellPayment[]>>;
}

export interface CalendarDayPayment {
  id: string;
  day: number;
  rowLabel: string;
  type: CalendarRowType;
  amount: number;
  paymentStatus: PaymentStatus;
}

export const CALENDAR_YEAR = 2026;
export const CALENDAR_MONTH = 6;
export const CALENDAR_MONTH_LABEL = "Czerwiec 2026";
export const CALENDAR_DAYS_IN_MONTH = 30;

function cell(
  amount: number,
  paymentStatus: PaymentStatus,
): CalendarCellPayment {
  return { amount, paymentStatus };
}

export const CALENDAR_COST_ROWS: CalendarRow[] = [
  {
    id: "cal-allegro",
    label: "Allegro",
    type: "koszt",
    amounts: { 1: cell(400, "zapłacone") },
  },
  {
    id: "cal-lokal",
    label: "Lokal",
    type: "koszt",
    amounts: { 2: cell(500, "zapłacone") },
  },
  {
    id: "cal-inne",
    label: "Inne",
    type: "koszt",
    amounts: { 1: cell(200, "zapłacone") },
  },
  {
    id: "cal-zus",
    label: "ZUS",
    type: "koszt",
    amounts: { 10: cell(1800, "zapłacone") },
  },
  {
    id: "cal-leasing",
    label: "Leasing auta",
    type: "koszt",
    amounts: { 15: cell(1200, "do zapłaty") },
  },
  {
    id: "cal-reklama",
    label: "Reklama Allegro",
    type: "koszt",
    amounts: { 12: cell(450, "po terminie"), 20: cell(800, "do zapłaty") },
  },
  {
    id: "cal-ovh",
    label: "Serwer OVH",
    type: "koszt",
    amounts: { 22: cell(250, "do zapłaty") },
  },
  {
    id: "cal-ksiegowosc",
    label: "Księgowość",
    type: "koszt",
    amounts: { 25: cell(350, "przesunięte") },
  },
  {
    id: "cal-cursor",
    label: "Cursor",
    type: "koszt",
    amounts: { 1: cell(80, "zapłacone") },
  },
];

export const CALENDAR_REVENUE_ROWS: CalendarRow[] = [
  {
    id: "cal-sprzedaz-allegro",
    label: "Planowany wpływ Allegro",
    type: "planowany wpływ",
    amounts: {
      1: cell(3000, "zapłacone"),
      15: [
        cell(1500, "wymaga potwierdzenia"),
        cell(600, "wymaga potwierdzenia"),
      ],
    },
  },
  {
    id: "cal-sprzedaz-sklep",
    label: "Planowany wpływ ze sklepu",
    type: "planowany wpływ",
    amounts: { 2: cell(1500, "zapłacone"), 15: cell(1000, "do zapłaty") },
  },
  {
    id: "cal-zwrot",
    label: "Zwrot środków",
    type: "planowany wpływ",
    amounts: { 25: cell(380, "przesunięte") },
  },
];

export const CALENDAR_ALL_ROWS: CalendarRow[] = [
  ...CALENDAR_COST_ROWS,
  ...CALENDAR_REVENUE_ROWS,
];

function normalizeCell(
  value: CalendarCellPayment | CalendarCellPayment[],
): CalendarCellPayment[] {
  return Array.isArray(value) ? value : [value];
}

export function buildCalendarDayPayments(): CalendarDayPayment[] {
  const payments: CalendarDayPayment[] = [];

  for (const row of CALENDAR_ALL_ROWS) {
    for (const [dayStr, raw] of Object.entries(row.amounts)) {
      const day = Number(dayStr);
      if (!raw || Number.isNaN(day)) continue;
      normalizeCell(raw).forEach((p, index) => {
        payments.push({
          id: `${row.id}-d${day}-${index}`,
          day,
          rowLabel: row.label,
          type: row.type,
          amount: p.amount,
          paymentStatus: p.paymentStatus,
        });
      });
    }
  }

  return payments.sort(
    (a, b) => a.day - b.day || a.rowLabel.localeCompare(b.rowLabel),
  );
}

export const CALENDAR_DAY_PAYMENTS = buildCalendarDayPayments();
