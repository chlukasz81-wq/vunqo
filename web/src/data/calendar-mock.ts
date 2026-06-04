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

export const CALENDAR_COST_ROWS: CalendarRow[] = [];

export const CALENDAR_REVENUE_ROWS: CalendarRow[] = [];

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
