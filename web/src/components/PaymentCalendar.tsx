"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { CalendarCellPayment, CalendarRow } from "@/data/calendar-mock";
import type { BudgetEntry } from "@/data/budget-mock";
import { PERIOD_OPTIONS, type PeriodFilter } from "@/lib/budget-utils";
import {
  buildCalendarRowsFromEntries,
  computeDayTotals,
  filterCalendarRows,
  formatCalendarPeriodSubtitle,
  formatCellAmount,
  getBrowserToday,
  getPaymentsForCell,
  getPolishWeekdayShort,
  getVisibleColumnsForPeriod,
  isTodayColumn,
  isWeekendColumn,
  mergeOverdueCostRowsIntoCalendar,
  sumColumn,
  type CalendarColumn,
  type CalendarRowFilter,
  type DayTotals,
} from "@/lib/calendar-utils";
import { getPeriodRange } from "@/lib/budget-utils";
import {
  getOverdueAmountTooltip,
  getOverdueCosts,
  getOverdueCostsForRowLabel,
  getOverdueRowColumnTooltip,
  getOverdueTotalColumnTooltip,
  isOverdueCost,
  sumOverdueAmount,
} from "@/lib/overdue-utils";

const ROW_FILTER_OPTIONS: { value: CalendarRowFilter; label: string }[] = [
  { value: "koszty", label: "Koszty" },
  { value: "przychody", label: "Wpływy" },
  { value: "wszystko", label: "Wszystko" },
];

const SOURCE_COL_CLASS =
  "sticky left-0 z-10 w-40 min-w-[10rem] border border-slate-200 bg-white px-2 py-2 text-left text-xs font-medium sm:text-sm";
const SOURCE_COL_HEAD_CLASS =
  "sticky left-0 z-20 w-40 min-w-[10rem] border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-600";
const OVERDUE_COL_CLASS =
  "sticky left-[10rem] z-10 w-16 min-w-[3.5rem] border border-slate-200 bg-rose-50/90 px-0.5 py-1.5 text-center";
const OVERDUE_COL_HEAD_CLASS =
  "sticky left-[10rem] z-20 w-16 min-w-[3.5rem] border border-rose-200 bg-rose-100 px-1 py-2 text-center text-xs font-semibold text-rose-800";
const DAY_COL_CLASS =
  "w-14 min-w-[3rem] border border-slate-200 px-0.5 py-1.5 text-center";

function selectedColumnBg(isSelected: boolean): string {
  return isSelected ? "bg-sky-50/50" : "";
}

function dayColumnSurfaceClasses(options: {
  columnSelected: boolean;
  weekend: boolean;
  isToday: boolean;
  overdue?: boolean;
  deficit?: boolean;
  forHeader?: boolean;
}): string {
  const parts: string[] = [];
  if (options.overdue) {
    parts.push("bg-rose-50 text-rose-900");
  } else if (options.deficit) {
    parts.push("bg-amber-50 text-amber-900");
  } else if (options.isToday) {
    parts.push("bg-sky-50/80 text-slate-800");
  } else if (options.weekend) {
    parts.push("bg-stone-50/90 text-slate-700");
  } else {
    parts.push("text-slate-700");
  }
  parts.push(selectedColumnBg(options.columnSelected));
  if (options.isToday) {
    parts.push(
      options.forHeader ? "ring-2 ring-sky-400" : "ring-1 ring-inset ring-sky-400",
    );
  }
  return parts.join(" ");
}

export type CalendarEmptyCellPayload = {
  rowType: CalendarRow["type"];
  rowLabel: string;
  dateIso: string;
};

export type CalendarOperationAmountPayload = {
  entryId: string;
  dateIso: string;
  paymentCountInCell: number;
};

export type CalendarOverdueClickPayload =
  | { scope: "all" }
  | { scope: "row"; rowLabel: string };

export type PaymentCalendarProps = {
  entries: BudgetEntry[];
  period: PeriodFilter;
  customStart: string;
  customEnd: string;
  onPeriodChange: (period: PeriodFilter) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  selectedDateIso: string | null;
  selectedOperationId: string | null;
  onSelectDate: (dateIso: string) => void;
  onOperationAmountClick: (payload: CalendarOperationAmountPayload) => void;
  onEmptyCalendarCellClick: (payload: CalendarEmptyCellPayload) => void;
  onOverdueColumnClick: (payload: CalendarOverdueClickPayload) => void;
  overdueDetails?: ReactNode;
  dayOperations?: ReactNode;
};

function OverdueAmountCell({
  amount,
  tooltip,
  onClick,
}: {
  amount: number;
  tooltip: string | null;
  onClick: () => void;
}) {
  return (
    <td className={OVERDUE_COL_CLASS}>
      <button
        type="button"
        title={tooltip ?? undefined}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="w-full cursor-pointer select-none rounded px-0.5 py-0.5 tabular-nums text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-200/60 sm:text-sm"
      >
        {formatCellAmount(amount)}
      </button>
    </td>
  );
}

function OverdueEmptyCell() {
  return (
    <td className={`${OVERDUE_COL_CLASS} text-xs text-slate-300`}>—</td>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
        active
          ? "bg-sky-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function CalendarCell({
  payments,
  rowType,
  rowLabel,
  columnSelected,
  weekend,
  isToday,
  dateIso,
  entriesById,
  onSelectDate,
  onOperationAmountClick,
  onEmptyCalendarCellClick,
}: {
  payments: CalendarCellPayment[];
  rowType: CalendarRow["type"];
  rowLabel: string;
  columnSelected: boolean;
  weekend: boolean;
  isToday: boolean;
  dateIso: string;
  entriesById: Map<string, BudgetEntry>;
  onSelectDate: (dateIso: string) => void;
  onOperationAmountClick: (payload: CalendarOperationAmountPayload) => void;
  onEmptyCalendarCellClick: (payload: CalendarEmptyCellPayload) => void;
}) {
  const hasOverduePayment =
    rowType === "koszt" &&
    payments.some((payment) => {
      if (!payment.entryId) return payment.paymentStatus === "po terminie";
      const entry = entriesById.get(payment.entryId);
      return entry ? isOverdueCost(entry) : payment.paymentStatus === "po terminie";
    });

  const surface = dayColumnSurfaceClasses({
    columnSelected,
    weekend,
    isToday,
    overdue: hasOverduePayment,
  });

  if (payments.length === 0) {
    return (
      <td className={`${DAY_COL_CLASS} p-0 ${surface}`}>
        <button
          type="button"
          onClick={() =>
            onEmptyCalendarCellClick({ rowType, rowLabel, dateIso })
          }
          className="group flex min-h-[2rem] w-full cursor-pointer items-center justify-center rounded-sm px-0.5 py-1.5 transition-colors hover:bg-sky-50/70"
          aria-label={`Dodaj operację: ${rowLabel}`}
        >
          <span className="text-slate-300 group-hover:hidden">—</span>
          <span className="hidden text-base font-medium leading-none text-sky-500 group-hover:inline">
            +
          </span>
        </button>
      </td>
    );
  }

  const amountClassBase =
    rowType === "koszt"
      ? "text-rose-700"
      : rowType === "rzeczywisty wpływ"
        ? "text-teal-700"
        : "text-emerald-700";

  return (
    <td className={`${DAY_COL_CLASS} ${surface}`}>
      <div className="flex min-h-[2rem] flex-col items-center justify-center gap-0.5">
        {payments.map((payment, index) => {
          const entryId = payment.entryId;
          const key = entryId ?? `cell-${index}`;
          const entry = entryId ? entriesById.get(entryId) : undefined;
          const overdue = entry ? isOverdueCost(entry) : payment.paymentStatus === "po terminie";
          const tooltip = entry ? getOverdueAmountTooltip(entry) : null;
          const amountClass = overdue
            ? "font-semibold text-rose-800 hover:bg-rose-100/80"
            : amountClassBase;
          return (
            <button
              key={key}
              type="button"
              disabled={!entryId}
              title={tooltip ?? undefined}
              onClick={(event) => {
                event.stopPropagation();
                if (entryId) {
                  onOperationAmountClick({
                    entryId,
                    dateIso,
                    paymentCountInCell: payments.length,
                  });
                } else {
                  onSelectDate(dateIso);
                }
              }}
              className={`cursor-pointer select-none rounded px-0.5 tabular-nums text-xs font-medium sm:text-sm ${amountClass} disabled:cursor-default disabled:hover:bg-transparent`}
            >
              {formatCellAmount(payment.amount)}
              {entry?.originalDueDate && (
                <span className="mt-0.5 block text-[8px] font-medium uppercase leading-none text-rose-500">
                  przen.
                </span>
              )}
            </button>
          );
        })}
        {payments.length > 1 && (
          <span className="select-none text-[9px] font-medium text-slate-400">
            ×{payments.length}
          </span>
        )}
      </div>
    </td>
  );
}

function isCalendarPeriodActive(
  period: PeriodFilter,
  option: PeriodFilter,
): boolean {
  if (option === "current-month") {
    return period === "current-month" || period === "month";
  }
  return period === option;
}

export function PaymentCalendar({
  entries,
  period,
  customStart,
  customEnd,
  onPeriodChange,
  onCustomStartChange,
  onCustomEndChange,
  selectedDateIso,
  selectedOperationId: _selectedOperationId,
  onSelectDate,
  onOperationAmountClick,
  onEmptyCalendarCellClick,
  onOverdueColumnClick,
  overdueDetails,
  dayOperations,
}: PaymentCalendarProps) {
  const [rowFilter, setRowFilter] = useState<CalendarRowFilter>("wszystko");
  const today = getBrowserToday();

  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  );

  const visibleColumns = useMemo(
    () => getVisibleColumnsForPeriod(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const periodRange = useMemo(
    () => getPeriodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const periodSubtitle = useMemo(
    () => formatCalendarPeriodSubtitle(period, visibleColumns),
    [period, visibleColumns],
  );

  const allRows = useMemo(
    () =>
      mergeOverdueCostRowsIntoCalendar(
        buildCalendarRowsFromEntries(entries, periodRange),
        entries,
      ),
    [entries, periodRange],
  );

  const totalOverdueAmount = useMemo(
    () => sumOverdueAmount(getOverdueCosts(entries)),
    [entries],
  );

  const costRowsAll = useMemo(
    () => allRows.filter((r) => r.type === "koszt"),
    [allRows],
  );
  const plannedRevenueRowsAll = useMemo(
    () => allRows.filter((r) => r.type === "planowany wpływ"),
    [allRows],
  );
  const realRevenueRowsAll = useMemo(
    () => allRows.filter((r) => r.type === "rzeczywisty wpływ"),
    [allRows],
  );

  const allDayTotals = useMemo(
    () => computeDayTotals(allRows, visibleColumns),
    [allRows, visibleColumns],
  );

  const totalsByDate = useMemo(() => {
    const map = new Map<string, DayTotals>();
    for (const t of allDayTotals) map.set(t.dateIso, t);
    return map;
  }, [allDayTotals]);

  const showCostSection =
    rowFilter === "wszystko" || rowFilter === "koszty";
  const showPlannedRevenueSection =
    rowFilter === "wszystko" || rowFilter === "przychody";
  const showRealRevenueSection =
    rowFilter === "wszystko" || rowFilter === "przychody";

  const costRows =
    rowFilter === "przychody"
      ? []
      : filterCalendarRows(costRowsAll, rowFilter);
  const plannedRevenueRows =
    rowFilter === "koszty"
      ? []
      : filterCalendarRows(plannedRevenueRowsAll, rowFilter);
  const realRevenueRows =
    rowFilter === "koszty"
      ? []
      : filterCalendarRows(realRevenueRowsAll, rowFilter);

  const visibleRows = useMemo(() => {
    const base =
      rowFilter === "koszty"
        ? costRowsAll
        : rowFilter === "przychody"
          ? [...plannedRevenueRowsAll, ...realRevenueRowsAll]
          : allRows;
    return filterCalendarRows(base, rowFilter);
  }, [rowFilter, allRows, costRowsAll, plannedRevenueRowsAll, realRevenueRowsAll]);

  const calendarTableKey = useMemo(
    () => visibleColumns.map((c) => c.iso).join(","),
    [visibleColumns],
  );

  const tableColSpan = visibleColumns.length + 2;

  const renderRows = (rows: CalendarRow[], sectionLabel: string) => (
    <>
      <tr className="bg-slate-100/90">
        <th
          colSpan={tableColSpan}
          className="border border-slate-200 px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {sectionLabel}
        </th>
      </tr>
      {rows.map((row) => {
        const rowOverdueAmount =
          row.type === "koszt"
            ? sumOverdueAmount(
                getOverdueCostsForRowLabel(entries, row.label),
              )
            : 0;
        const rowOverdueTooltip =
          row.type === "koszt"
            ? getOverdueRowColumnTooltip(row.label, entries)
            : null;

        return (
        <tr key={row.id}>
          <th
            scope="row"
            className={`${SOURCE_COL_CLASS} ${
              row.type === "koszt"
                ? "text-rose-800"
                : row.type === "rzeczywisty wpływ"
                  ? "text-teal-800"
                  : "text-emerald-800"
            }`}
          >
            {row.label}
          </th>
          {row.type === "koszt" && rowOverdueAmount > 0 ? (
            <OverdueAmountCell
              amount={rowOverdueAmount}
              tooltip={rowOverdueTooltip}
              onClick={() =>
                onOverdueColumnClick({ scope: "row", rowLabel: row.label })
              }
            />
          ) : (
            <OverdueEmptyCell />
          )}
          {visibleColumns.map((column) => (
            <CalendarCell
              key={column.iso}
              dateIso={column.iso}
              rowLabel={row.label}
              entriesById={entriesById}
              payments={getPaymentsForCell(row, column.iso)}
              rowType={row.type}
              columnSelected={selectedDateIso === column.iso}
              weekend={isWeekendColumn(column)}
              isToday={isTodayColumn(column, today)}
              onSelectDate={onSelectDate}
              onOperationAmountClick={onOperationAmountClick}
              onEmptyCalendarCellClick={onEmptyCalendarCellClick}
            />
          ))}
        </tr>
        );
      })}
    </>
  );

  const renderDayHeader = (column: CalendarColumn) => {
    const dayTotal = totalsByDate.get(column.iso);
    const deficit = dayTotal?.deficit ?? false;
    const overdue = dayTotal?.hasOverdue ?? false;
    const isSelected = selectedDateIso === column.iso;
    const weekend = isWeekendColumn(column);
    const isToday = isTodayColumn(column, today);
    const weekday = getPolishWeekdayShort(column.date);

    return (
      <th
        key={column.iso}
        className={`${DAY_COL_CLASS} text-xs font-semibold tabular-nums sm:text-sm ${dayColumnSurfaceClasses(
          {
            columnSelected: isSelected,
            weekend,
            isToday,
            overdue,
            deficit,
            forHeader: true,
          },
        )}`}
      >
        <button
          type="button"
          onClick={() => onSelectDate(column.iso)}
          className="flex w-full cursor-pointer select-none flex-col items-center gap-0.5 rounded px-0.5 py-0.5 hover:bg-sky-50/80"
          title={
            overdue
              ? "Płatność po terminie"
              : deficit
                ? "Koszty przewyższają planowane przychody"
                : undefined
          }
        >
          {isToday && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-sky-600">
              dziś
            </span>
          )}
          <span
            className={`text-[10px] font-medium uppercase ${
              weekend ? "text-stone-600" : "text-slate-500"
            }`}
          >
            {weekday}
          </span>
          <span>{column.day}</span>
        </button>
      </th>
    );
  };

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-2 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Kalendarz płatności
        </h2>
        <p className="text-sm text-slate-600">{periodSubtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 px-4 py-2 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
            Typ:
          </span>
          {ROW_FILTER_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={rowFilter === opt.value}
              onClick={() => setRowFilter(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>
        <span className="hidden h-4 w-px bg-slate-200 sm:inline" aria-hidden />
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
            Okres:
          </span>
          {PERIOD_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={isCalendarPeriodActive(period, opt.value)}
              onClick={() => onPeriodChange(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
          {period === "custom" && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-0.5 text-xs text-slate-600">
                Od daty
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <label className="flex flex-col gap-0.5 text-xs text-slate-600">
                Do daty
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {overdueDetails ?? null}
      {dayOperations ?? null}

      <div className="overflow-x-auto p-3 sm:p-4">
        <table
          key={calendarTableKey}
          className="w-full min-w-max border-collapse text-left"
        >
          <thead>
            <tr className="bg-slate-50">
              <th className={SOURCE_COL_HEAD_CLASS}>Źródło</th>
              <th className={OVERDUE_COL_HEAD_CLASS}>Zaległości</th>
              {visibleColumns.map(renderDayHeader)}
            </tr>
          </thead>
          <tbody>
            {showCostSection && renderRows(costRows, "KOSZTY")}
            {showPlannedRevenueSection &&
              renderRows(plannedRevenueRows, "PLANOWANE WPŁYWY")}
            {showRealRevenueSection &&
              realRevenueRows.length > 0 &&
              renderRows(realRevenueRows, "RZECZYWISTE WPŁYWY")}
            <tr className="bg-slate-50 font-semibold">
              <th
                scope="row"
                className={`${SOURCE_COL_CLASS} bg-slate-100 text-xs uppercase tracking-wide text-slate-700 sm:text-sm`}
              >
                SUMA
              </th>
              {totalOverdueAmount > 0 ? (
                <OverdueAmountCell
                  amount={totalOverdueAmount}
                  tooltip={getOverdueTotalColumnTooltip(entries)}
                  onClick={() => onOverdueColumnClick({ scope: "all" })}
                />
              ) : (
                <td
                  className={`${OVERDUE_COL_CLASS} bg-slate-100 text-xs text-slate-300`}
                >
                  —
                </td>
              )}
              {visibleColumns.map((column) => {
                const dayTotal = totalsByDate.get(column.iso);
                const colSum = sumColumn(visibleRows, column.iso);
                const net = dayTotal?.net ?? 0;
                const showNet = rowFilter === "wszystko";
                const isSelected = selectedDateIso === column.iso;
                const weekend = isWeekendColumn(column);
                const isToday = isTodayColumn(column, today);

                return (
                  <td
                    key={column.iso}
                    className={`${DAY_COL_CLASS} ${dayColumnSurfaceClasses({
                      columnSelected: isSelected,
                      weekend,
                      isToday,
                    })}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectDate(column.iso)}
                      className="w-full cursor-pointer select-none text-xs tabular-nums hover:bg-sky-50/50 sm:text-sm"
                    >
                      {showNet ? (
                        <span
                          className={
                            net >= 0 ? "text-emerald-800" : "text-rose-800"
                          }
                        >
                          {net >= 0 ? "+" : "−"}
                          {formatCellAmount(Math.abs(net))}
                        </span>
                      ) : (
                        <span className="text-slate-800">
                          {formatCellAmount(colSum)}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
