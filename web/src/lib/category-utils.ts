import type { CSSProperties } from "react";
import type {
  BudgetCategory,
  BudgetEntry,
  CategoryType,
  OperationType,
} from "@/data/budget-mock";
import { isInflowType } from "@/lib/budget-utils";

export const OTHER_COST_NAME = "Inne";
export const OTHER_REVENUE_NAME = "Inne wpływy";

export const CATEGORY_COLOR_PRESETS = [
  { id: "slate", bg: "bg-slate-100", text: "text-slate-800", ring: "ring-slate-200" },
  { id: "sky", bg: "bg-sky-100", text: "text-sky-800", ring: "ring-sky-200" },
  { id: "rose", bg: "bg-rose-100", text: "text-rose-800", ring: "ring-rose-200" },
  {
    id: "emerald",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
  },
  { id: "amber", bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-200" },
  {
    id: "violet",
    bg: "bg-violet-100",
    text: "text-violet-800",
    ring: "ring-violet-200",
  },
] as const;

export type CategoryColorPresetId = (typeof CATEGORY_COLOR_PRESETS)[number]["id"];

export type DeleteCategoryStrategy = "move-to-other" | "clear-category";

export type CategoryFormType = "koszt" | "planowany przychód";

const TYPE_LABELS: Record<CategoryType, string> = {
  koszt: "koszt",
  "planowany przychód": "planowany przychód",
  oba: "oba",
};

/** Migruje typ kategorii z localStorage (przychód → planowany przychód). */
export function migrateCategoryType(type: string): CategoryType {
  if (type === "przychód") return "planowany przychód";
  if (type === "koszt" || type === "planowany przychód" || type === "oba") {
    return type;
  }
  return "koszt";
}

export function migrateStoredCategory(category: BudgetCategory): BudgetCategory {
  return {
    ...migrateCategoryColor(category),
    type: migrateCategoryType(category.type),
  };
}

export function getCategoryTypeLabel(type: CategoryType): string {
  return TYPE_LABELS[type];
}

export function filterCategoriesByFormType(
  categories: BudgetCategory[],
  formType: CategoryFormType,
): BudgetCategory[] {
  return categories.filter((c) =>
    formType === "koszt"
      ? c.type === "koszt" || c.type === "oba"
      : c.type === "planowany przychód" || c.type === "oba",
  );
}

export function countEntriesForCategory(
  entries: BudgetEntry[],
  categoryName: string,
): number {
  return entries.filter((e) => e.category === categoryName).length;
}

export function renameCategoryOnEntries(
  entries: BudgetEntry[],
  oldName: string,
  newName: string,
): BudgetEntry[] {
  if (oldName === newName) return entries;
  return entries.map((e) =>
    e.category === oldName ? { ...e, category: newName } : e,
  );
}

export function resolveOtherCategoryForEntry(entry: BudgetEntry): string {
  return isInflowType(entry.type) ? OTHER_REVENUE_NAME : OTHER_COST_NAME;
}

export function applyDeleteCategoryStrategy(
  entries: BudgetEntry[],
  categoryName: string,
  strategy: DeleteCategoryStrategy,
): BudgetEntry[] {
  return entries.map((e) => {
    if (e.category !== categoryName) return e;
    if (strategy === "clear-category") {
      return { ...e, category: "" };
    }
    return { ...e, category: resolveOtherCategoryForEntry(e) };
  });
}

export function isHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

export function getCategoryBadgeClassName(color: string): string {
  const preset = CATEGORY_COLOR_PRESETS.find((p) => p.id === color);
  if (preset) {
    return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${preset.bg} ${preset.text} ${preset.ring}`;
  }
  return "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-slate-100 text-slate-800 ring-slate-200";
}

export const CATEGORY_SWATCH_CLASS: Record<CategoryColorPresetId, string> = {
  slate: "bg-slate-500",
  sky: "bg-sky-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
};

const DOT_COLOR_CLASS: Record<CategoryColorPresetId, string> = {
  slate: "bg-slate-400",
  sky: "bg-sky-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
};

export function getCategoryDotStyle(color: string): CSSProperties | undefined {
  if (isHexColor(color)) {
    return { backgroundColor: color };
  }
  return undefined;
}

export function getCategoryDotClassName(color: string): string {
  const preset = CATEGORY_COLOR_PRESETS.find((p) => p.id === color);
  const base = "h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-white/80";
  if (preset && preset.id in DOT_COLOR_CLASS) {
    return `${base} ${DOT_COLOR_CLASS[preset.id as CategoryColorPresetId]}`;
  }
  if (isHexColor(color)) {
    return `${base} ring-slate-200`;
  }
  return `${base} bg-slate-400`;
}

export function formatCategoryDisplayName(name: string): string {
  return name.trim() ? name : "—";
}

export function findCategoryByName(
  categories: BudgetCategory[],
  name: string,
): BudgetCategory | undefined {
  return categories.find((c) => c.name === name);
}

export function categoryNameExists(
  categories: BudgetCategory[],
  name: string,
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase();
  return categories.some(
    (c) =>
      c.id !== excludeId && c.name.trim().toLowerCase() === normalized,
  );
}

export function defaultColorForType(type: CategoryType): string {
  if (type === "planowany przychód") return "emerald";
  if (type === "oba") return "violet";
  return "slate";
}

export function migrateCategoryColor(category: BudgetCategory): BudgetCategory {
  if (category.color) return category;
  return { ...category, color: defaultColorForType(category.type) };
}

export function sortCategories(categories: BudgetCategory[]): BudgetCategory[] {
  const typeOrder: Record<CategoryType, number> = {
    koszt: 0,
    "planowany przychód": 1,
    oba: 2,
  };
  return [...categories].sort(
    (a, b) =>
      typeOrder[a.type] - typeOrder[b.type] ||
      a.name.localeCompare(b.name, "pl"),
  );
}

export function filterCategoriesForOperationType(
  categories: BudgetCategory[],
  operationType: OperationType,
): BudgetCategory[] {
  return filterCategoriesByFormType(
    categories,
    operationType === "koszt" ? "koszt" : "planowany przychód",
  );
}

/** @deprecated Użyj filterCategoriesForOperationType */
export function filterCategoriesForEntryType(
  categories: BudgetCategory[],
  entryType: OperationType,
): BudgetCategory[] {
  return filterCategoriesForOperationType(categories, entryType);
}
