import type { BudgetEntry } from "@/data/budget-mock";
import {
  DEFAULT_INCOME_SOURCES,
  type IncomeSource,
} from "@/data/income-sources-mock";
import { REFERENCE_DATE } from "@/data/budget-mock";
import { isInflowType } from "@/lib/budget-utils";

export function createIncomeSourceId(): string {
  return `is-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isIncomeSource(value: unknown): value is IncomeSource {
  if (!value || typeof value !== "object") return false;
  const s = value as IncomeSource;
  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.defaultCategory === "string" &&
    (s.defaultType === "planowany wpływ" ||
      s.defaultType === "rzeczywisty wpływ" ||
      s.defaultType === "oba")
  );
}

export function sortIncomeSources(sources: IncomeSource[]): IncomeSource[] {
  return [...sources].sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export function findIncomeSourceById(
  sources: IncomeSource[],
  id: string,
): IncomeSource | undefined {
  return sources.find((s) => s.id === id);
}

export function findIncomeSourceByName(
  sources: IncomeSource[],
  name: string,
): IncomeSource | undefined {
  const normalized = name.trim().toLowerCase();
  return sources.find((s) => s.name.trim().toLowerCase() === normalized);
}

export function incomeSourceExists(
  sources: IncomeSource[],
  name: string,
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase();
  return sources.some(
    (s) =>
      s.id !== excludeId && s.name.trim().toLowerCase() === normalized,
  );
}

export function countEntriesForIncomeSource(
  entries: BudgetEntry[],
  source: IncomeSource,
): number {
  return entries.filter(
    (e) =>
      isInflowType(e.type) &&
      (e.incomeSourceId === source.id || e.name === source.name),
  ).length;
}

export function renameIncomeSourceOnEntries(
  entries: BudgetEntry[],
  oldName: string,
  newName: string,
  incomeSourceId?: string,
): BudgetEntry[] {
  if (oldName === newName && !incomeSourceId) return entries;
  return entries.map((e) => {
    if (!isInflowType(e.type)) return e;
    const matches =
      (incomeSourceId && e.incomeSourceId === incomeSourceId) ||
      e.name === oldName;
    if (!matches) return e;
    return {
      ...e,
      name: newName,
      incomeSourceId: incomeSourceId ?? e.incomeSourceId,
    };
  });
}

export function reassignIncomeSourceOnEntries(
  entries: BudgetEntry[],
  from: IncomeSource,
  to: IncomeSource,
): BudgetEntry[] {
  return entries.map((e) => {
    if (!isInflowType(e.type)) return e;
    const matches =
      e.incomeSourceId === from.id || e.name === from.name;
    if (!matches) return e;
    return {
      ...e,
      name: to.name,
      incomeSourceId: to.id,
      category: to.defaultCategory,
    };
  });
}

export function clearIncomeSourceOnEntries(
  entries: BudgetEntry[],
  source: IncomeSource,
): BudgetEntry[] {
  return entries.map((e) => {
    if (!isInflowType(e.type)) return e;
    const matches =
      e.incomeSourceId === source.id || e.name === source.name;
    if (!matches) return e;
    const { incomeSourceId: _id, ...rest } = e;
    return rest;
  });
}

export function formatIncomeDescription(
  template: string | undefined,
  refDate: Date = REFERENCE_DATE,
): string {
  if (!template) return "";
  const month = String(refDate.getMonth() + 1).padStart(2, "0");
  const year = String(refDate.getFullYear());
  return template
    .replace(/\{month\}/g, month)
    .replace(/\{year\}/g, year);
}

export function migrateEntriesIncomeSources(
  entries: BudgetEntry[],
  sources: IncomeSource[] = DEFAULT_INCOME_SOURCES,
): BudgetEntry[] {
  return entries.map((entry) => {
    if (!isInflowType(entry.type)) return entry;
    if (entry.incomeSourceId) return entry;
    const match = findIncomeSourceByName(sources, entry.name);
    if (!match) return entry;
    return {
      ...entry,
      incomeSourceId: match.id,
    };
  });
}
