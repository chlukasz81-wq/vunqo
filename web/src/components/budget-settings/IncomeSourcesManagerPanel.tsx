"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { BudgetCategory, BudgetEntry } from "@/data/budget-mock";
import type {
  IncomeSource,
  IncomeSourceDefaultType,
} from "@/data/income-sources-mock";
import {
  countEntriesForIncomeSource,
  createIncomeSourceId,
  incomeSourceExists,
  sortIncomeSources,
} from "@/lib/income-source-utils";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

type DeleteStep = "list" | "confirm" | "strategy" | "reassign";

const DEFAULT_TYPE_OPTIONS: { value: IncomeSourceDefaultType; label: string }[] =
  [
    { value: "planowany wpływ", label: "planowany wpływ" },
    { value: "rzeczywisty wpływ", label: "rzeczywisty wpływ" },
    { value: "oba", label: "oba" },
  ];

export type IncomeSourcesManagerPanelProps = {
  incomeSources: IncomeSource[];
  entries: BudgetEntry[];
  revenueCategories: BudgetCategory[];
  onAdd: (source: IncomeSource) => void;
  onUpdate: (source: IncomeSource, previousName: string) => void;
  onDelete: (
    id: string,
    strategy: "clear" | "reassign",
    reassignToId?: string,
  ) => void;
};

export function IncomeSourcesManagerPanel({
  incomeSources,
  entries,
  revenueCategories,
  onAdd,
  onUpdate,
  onDelete,
}: IncomeSourcesManagerPanelProps) {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(
    revenueCategories[0]?.name ?? "",
  );
  const [newType, setNewType] =
    useState<IncomeSourceDefaultType>("planowany wpływ");
  const [newDescription, setNewDescription] = useState("");
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] =
    useState<IncomeSourceDefaultType>("planowany wpływ");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("list");
  const [reassignToId, setReassignToId] = useState("");

  const sorted = useMemo(
    () => sortIncomeSources(incomeSources),
    [incomeSources],
  );

  const deleting = deleteId
    ? incomeSources.find((s) => s.id === deleteId)
    : undefined;
  const deleteCount = deleting
    ? countEntriesForIncomeSource(entries, deleting)
    : 0;
  const reassignOptions = sorted.filter((s) => s.id !== deleteId);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || !newCategory) return;
    if (incomeSourceExists(incomeSources, trimmed)) {
      setAddError("Źródło o tej nazwie już istnieje.");
      return;
    }
    onAdd({
      id: createIncomeSourceId(),
      name: trimmed,
      defaultCategory: newCategory,
      defaultType: newType,
      defaultDescription: newDescription.trim() || undefined,
    });
    setNewName("");
    setNewDescription("");
    setAddError("");
  };

  const startEdit = (source: IncomeSource) => {
    setEditingId(source.id);
    setEditName(source.name);
    setEditCategory(source.defaultCategory);
    setEditType(source.defaultType);
    setEditDescription(source.defaultDescription ?? "");
    setEditError("");
  };

  const saveEdit = (source: IncomeSource) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Nazwa nie może być pusta.");
      return;
    }
    if (incomeSourceExists(incomeSources, trimmed, source.id)) {
      setEditError("Źródło o tej nazwie już istnieje.");
      return;
    }
    onUpdate(
      {
        ...source,
        name: trimmed,
        defaultCategory: editCategory,
        defaultType: editType,
        defaultDescription: editDescription.trim() || undefined,
      },
      source.name,
    );
    setEditingId(null);
  };

  const startDelete = (id: string) => {
    setDeleteId(id);
    setDeleteStep("confirm");
    const firstOther = incomeSources.find((s) => s.id !== id);
    setReassignToId(firstOther?.id ?? "");
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteStep("list");
  };

  const confirmDeleteFirst = () => {
    if (deleteCount > 0) {
      setDeleteStep("strategy");
    } else if (deleteId) {
      onDelete(deleteId, "clear");
      cancelDelete();
    }
  };

  if (deleteStep !== "list" && deleting) {
    return (
      <div className="space-y-4">
        {deleteStep === "confirm" && (
          <>
            <p className="text-sm text-slate-700">
              Czy na pewno usunąć to źródło wpływu?
            </p>
            <p className="text-sm text-slate-600">
              <strong>{deleting.name}</strong>
            </p>
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
              To źródło ma przypisane operacje wpływów. Co zrobić z nimi?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (deleteId) {
                    onDelete(deleteId, "clear");
                    cancelDelete();
                  }
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-sky-300 hover:bg-sky-50"
              >
                Zostaw operacje bez przypisanego źródła
              </button>
              <button
                type="button"
                onClick={() => setDeleteStep("reassign")}
                disabled={reassignOptions.length === 0}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
              >
                Przenieś operacje do innego źródła
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
        {deleteStep === "reassign" && (
          <>
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Nowe źródło wpływu
              <select
                value={reassignToId}
                onChange={(e) => setReassignToId(e.target.value)}
                className={inputClass}
              >
                {reassignOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep("strategy")}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Wstecz
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteId && reassignToId) {
                    onDelete(deleteId, "reassign", reassignToId);
                    cancelDelete();
                  }
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Usuń i przypisz
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleAdd}
        className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Dodaj źródło wpływu
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Nazwa
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError("");
              }}
              className={inputClass}
              placeholder="np. PayU"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Domyślna kategoria
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={inputClass}
            >
              {revenueCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Domyślny typ
            <select
              value={newType}
              onChange={(e) =>
                setNewType(e.target.value as IncomeSourceDefaultType)
              }
              className={inputClass}
            >
              {DEFAULT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 sm:col-span-2">
            Domyślny opis / tytuł
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="np. Allegro — wpływ {month}.{year}"
              className={inputClass}
            />
          </label>
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
              <th className="px-3 py-2">Domyślna kategoria</th>
              <th className="px-3 py-2">Domyślny typ</th>
              <th className="px-3 py-2">Opis</th>
              <th className="px-3 py-2 text-center">Liczba operacji</th>
              <th className="px-3 py-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((source) => {
              const count = countEntriesForIncomeSource(entries, source);
              const isEditing = editingId === source.id;

              return (
                <tr key={source.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-3 align-top">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setEditError("");
                        }}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-slate-900">
                        {source.name}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {isEditing ? (
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className={inputClass}
                      >
                        {revenueCategories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      source.defaultCategory
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {isEditing ? (
                      <select
                        value={editType}
                        onChange={(e) =>
                          setEditType(e.target.value as IncomeSourceDefaultType)
                        }
                        className={inputClass}
                      >
                        {DEFAULT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      source.defaultType
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-slate-600">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className={inputClass}
                      />
                    ) : (
                      source.defaultDescription || "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-center align-top tabular-nums">
                    {count}
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        {editError && (
                          <p className="text-xs text-rose-700">{editError}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => saveEdit(source)}
                          className="text-xs font-medium text-sky-700 hover:underline"
                        >
                          Zapisz
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-600 hover:underline"
                        >
                          Anuluj
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(source)}
                          className="text-xs font-medium text-sky-700 hover:underline"
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          onClick={() => startDelete(source.id)}
                          className="text-xs font-medium text-rose-700 hover:underline"
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
