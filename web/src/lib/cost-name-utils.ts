import type { BudgetEntry } from "@/data/budget-mock";
import {
  DEFAULT_COST_NAMES,
  type CostName,
} from "@/data/cost-names-mock";
import { REFERENCE_DATE } from "@/data/budget-mock";

export function createCostNameId(): string {
  return `cn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isCostName(value: unknown): value is CostName {
  if (!value || typeof value !== "object") return false;
  const c = value as CostName;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.defaultCategory === "string" &&
    typeof c.cyclic === "boolean"
  );
}

export function sortCostNames(names: CostName[]): CostName[] {
  return [...names].sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export function findCostNameById(
  names: CostName[],
  id: string,
): CostName | undefined {
  return names.find((n) => n.id === id);
}

export function findCostNameByName(
  names: CostName[],
  name: string,
): CostName | undefined {
  const normalized = name.trim().toLowerCase();
  return names.find((n) => n.name.trim().toLowerCase() === normalized);
}

export function costNameExists(
  names: CostName[],
  name: string,
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase();
  return names.some(
    (n) =>
      n.id !== excludeId && n.name.trim().toLowerCase() === normalized,
  );
}

export function countEntriesForCostName(
  entries: BudgetEntry[],
  costName: CostName,
): number {
  return entries.filter(
    (e) =>
      e.type === "koszt" &&
      (e.costNameId === costName.id || e.costName === costName.name),
  ).length;
}

export function renameCostNameOnEntries(
  entries: BudgetEntry[],
  oldName: string,
  newName: string,
  costNameId?: string,
): BudgetEntry[] {
  if (oldName === newName && !costNameId) return entries;
  return entries.map((e) => {
    if (e.type !== "koszt") return e;
    const matches =
      (costNameId && e.costNameId === costNameId) ||
      e.costName === oldName ||
      (!e.costNameId && e.name === oldName);
    if (!matches) return e;
    return {
      ...e,
      name: e.name === oldName ? newName : e.name,
      costName: newName,
      costNameId: costNameId ?? e.costNameId,
    };
  });
}

export function reassignCostNameOnEntries(
  entries: BudgetEntry[],
  from: CostName,
  to: CostName,
): BudgetEntry[] {
  return entries.map((e) => {
    if (e.type !== "koszt") return e;
    const matches =
      e.costNameId === from.id ||
      e.costName === from.name ||
      (!e.costNameId && e.name === from.name);
    if (!matches) return e;
    return {
      ...e,
      name: e.name === from.name ? to.name : e.name,
      costName: to.name,
      costNameId: to.id,
    };
  });
}

export function clearCostNameOnEntries(
  entries: BudgetEntry[],
  costName: CostName,
): BudgetEntry[] {
  return entries.map((e) => {
    if (e.type !== "koszt") return e;
    const matches =
      e.costNameId === costName.id ||
      e.costName === costName.name ||
      (!e.costNameId && e.name === costName.name);
    if (!matches) return e;
    const { costName: _cn, costNameId: _id, ...rest } = e;
    return rest;
  });
}

export function formatTransferTitle(
  template: string | undefined,
  refDate: Date = REFERENCE_DATE,
): string {
  if (!template) return "";
  const month = String(refDate.getMonth() + 1).padStart(2, "0");
  const year = String(refDate.getFullYear());
  return template.replace(/\{month\}/g, month).replace(/\{year\}/g, year);
}

export function dueDateForPaymentDay(
  dayOfMonth: number,
  refDate: Date = REFERENCE_DATE,
): string {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(Math.max(1, dayOfMonth), lastDay);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Dopasowuje legacy wpisy kosztów do domyślnych nazw po polu name. */
export function migrateEntriesCostNames(
  entries: BudgetEntry[],
  costNames: CostName[] = DEFAULT_COST_NAMES,
): BudgetEntry[] {
  return entries.map((entry) => {
    if (entry.type !== "koszt") return entry;
    if (entry.costNameId || entry.costName) return entry;
    const match = findCostNameByName(costNames, entry.name);
    if (!match) return entry;
    return {
      ...entry,
      costName: match.name,
      costNameId: match.id,
    };
  });
}

