"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { BudgetCategory, BudgetEntry, CategoryType } from "@/data/budget-mock";
import { createCategoryId } from "@/lib/budget-utils";
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_SWATCH_CLASS,
  categoryNameExists,
  countEntriesForCategory,
  defaultColorForType,
  getCategoryBadgeClassName,
  getCategoryDotClassName,
  getCategoryDotStyle,
  getCategoryTypeLabel,
  sortCategories,
} from "@/lib/category-utils";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

type DeleteStep = "list" | "confirm" | "strategy";
export type CategorySide = "cost" | "income";

function filterBySide(categories: BudgetCategory[], side: CategorySide) {
  return categories.filter((c) =>
    side === "cost"
      ? c.type === "koszt" || c.type === "oba"
      : c.type === "planowany przychód" || c.type === "oba",
  );
}

function defaultTypeForSide(side: CategorySide): CategoryType {
  return side === "cost" ? "koszt" : "planowany przychód";
}

function ColorSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_COLOR_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          title={preset.id}
          onClick={() => onChange(preset.id)}
          className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-all ${CATEGORY_SWATCH_CLASS[preset.id]} ${
            value === preset.id
              ? "ring-sky-600 scale-110"
              : "ring-transparent hover:ring-slate-300"
          }`}
          aria-label={`Kolor ${preset.id}`}
        />
      ))}
    </div>
  );
}

export type CategoriesManagerPanelProps = {
  side: CategorySide;
  categories: BudgetCategory[];
  entries: BudgetEntry[];
  onAddCategory: (category: BudgetCategory) => void;
  onUpdateCategory: (category: BudgetCategory, previousName: string) => void;
  onDeleteCategory: (
    id: string,
    strategy: "move-to-other" | "clear-category",
  ) => void;
};

export function CategoriesManagerPanel({
  side,
  categories,
  entries,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesManagerPanelProps) {
  const presetType = defaultTypeForSide(side);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CategoryType>(presetType);
  const [newColor, setNewColor] = useState(defaultColorForType(presetType));
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("list");

  const scoped = useMemo(() => filterBySide(categories, side), [categories, side]);
  const sorted = useMemo(() => sortCategories(scoped), [scoped]);

  const deletingCategory = deleteId
    ? categories.find((c) => c.id === deleteId)
    : undefined;
  const deleteCount = deletingCategory
    ? countEntriesForCategory(entries, deletingCategory.name)
    : 0;

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categoryNameExists(categories, trimmed)) {
      setAddError("Kategoria o tej nazwie już istnieje.");
      return;
    }
    onAddCategory({
      id: createCategoryId(),
      name: trimmed,
      type: newType,
      color: newColor,
    });
    setNewName("");
    setNewType(presetType);
    setNewColor(defaultColorForType(presetType));
    setAddError("");
  };

  const startEditName = (cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditError("");
  };

  const saveEditName = (cat: BudgetCategory) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Nazwa nie może być pusta.");
      return;
    }
    if (categoryNameExists(categories, trimmed, cat.id)) {
      setEditError("Kategoria o tej nazwie już istnieje.");
      return;
    }
    onUpdateCategory({ ...cat, name: trimmed }, cat.name);
    setEditingId(null);
    setEditError("");
  };

  const startDelete = (id: string) => {
    setDeleteId(id);
    setDeleteStep("confirm");
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteStep("list");
  };

  const confirmDeleteFirst = () => {
    if (deleteCount > 0) {
      setDeleteStep("strategy");
    } else if (deleteId) {
      onDeleteCategory(deleteId, "move-to-other");
      cancelDelete();
    }
  };

  const finishDelete = (strategy: "move-to-other" | "clear-category") => {
    if (!deleteId) return;
    onDeleteCategory(deleteId, strategy);
    cancelDelete();
  };

  if (deleteStep !== "list" && deletingCategory) {
    return (
      <div className="space-y-4">
        {deleteStep === "confirm" && (
          <>
            <p className="text-sm text-slate-700">
              Czy na pewno usunąć kategorię{" "}
              <strong>{deletingCategory.name}</strong>?
            </p>
            {deleteCount > 0 && (
              <p className="text-sm text-amber-800">
                Ta kategoria ma {deleteCount}{" "}
                {deleteCount === 1
                  ? "przypisaną operację"
                  : "przypisane operacje"}
                .
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={confirmDeleteFirst}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Usuń
              </button>
            </div>
          </>
        )}
        {deleteStep === "strategy" && (
          <>
            <p className="text-sm text-slate-700">
              Ta kategoria ma przypisane operacje. Wybierz, co zrobić z tymi
              operacjami.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => finishDelete("move-to-other")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-sky-300 hover:bg-sky-50"
              >
                Przenieś do „Inne” / „Inne wpływy”
              </button>
              <button
                type="button"
                onClick={() => finishDelete("clear-category")}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-sky-300 hover:bg-sky-50"
              >
                Zostaw bez kategorii
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Anuluj
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const typeOptions: { value: CategoryType; label: string }[] =
    side === "cost"
      ? [
          { value: "koszt", label: "koszt" },
          { value: "oba", label: "oba" },
        ]
      : [
          { value: "planowany przychód", label: "planowany przychód" },
          { value: "oba", label: "oba" },
        ];

  return (
    <div>
      <form
        onSubmit={handleAdd}
        className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Dodaj kategorię
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-600 sm:col-span-2">
            Nazwa
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError("");
              }}
              className={inputClass}
              placeholder={side === "cost" ? "np. Biuro" : "np. Sprzedaż B2B"}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Typ
            <select
              value={newType}
              onChange={(e) => {
                const next = e.target.value as CategoryType;
                setNewType(next);
                setNewColor(defaultColorForType(next));
              }}
              className={inputClass}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-sm text-slate-600">
            Kolor
            <ColorSwatches value={newColor} onChange={setNewColor} />
          </div>
        </div>
        {addError && <p className="mt-2 text-sm text-rose-700">{addError}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Dodaj
          </button>
        </div>
      </form>

      <div className="max-h-[min(24rem,50vh)] overflow-y-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Nazwa</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Kolor</th>
              <th className="px-3 py-2 text-center">Liczba operacji</th>
              <th className="px-3 py-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  Brak kategorii.
                </td>
              </tr>
            ) : (
              sorted.map((cat) => {
                const count = countEntriesForCategory(entries, cat.name);
                const isEditing = editingId === cat.id;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-3 align-top">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => {
                              setEditName(e.target.value);
                              setEditError("");
                            }}
                            className={inputClass}
                            autoFocus
                          />
                          {editError && (
                            <p className="text-xs text-rose-700">{editError}</p>
                          )}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => saveEditName(cat)}
                              className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800"
                            >
                              Zapisz
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-600"
                            >
                              Anuluj
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-900">
                          {cat.name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <select
                        value={cat.type}
                        onChange={(e) =>
                          onUpdateCategory(
                            {
                              ...cat,
                              type: e.target.value as CategoryType,
                            },
                            cat.name,
                          )
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-800"
                      >
                        {typeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-slate-500">
                        {getCategoryTypeLabel(cat.type)}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <ColorSwatches
                        value={
                          CATEGORY_COLOR_PRESETS.some((p) => p.id === cat.color)
                            ? cat.color
                            : "slate"
                        }
                        onChange={(color) =>
                          onUpdateCategory({ ...cat, color }, cat.name)
                        }
                      />
                      <span
                        className={`mt-2 inline-flex ${getCategoryBadgeClassName(cat.color)}`}
                      >
                        <span
                          className={getCategoryDotClassName(cat.color)}
                          style={getCategoryDotStyle(cat.color)}
                          aria-hidden
                        />
                        Podgląd
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center align-top tabular-nums text-slate-700">
                      {count}
                    </td>
                    <td className="px-3 py-3 text-right align-top">
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEditName(cat)}
                          className="text-xs font-medium text-sky-700 hover:underline"
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          onClick={() => startDelete(cat.id)}
                          className="text-xs font-medium text-rose-700 hover:underline"
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
