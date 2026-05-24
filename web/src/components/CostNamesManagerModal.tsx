"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { BudgetCategory, BudgetEntry } from "@/data/budget-mock";
import type { CostName } from "@/data/cost-names-mock";
import {
  costNameExists,
  countEntriesForCostName,
  createCostNameId,
  sortCostNames,
} from "@/lib/cost-name-utils";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

type DeleteStep = "list" | "confirm" | "strategy" | "reassign";

export type CostNamesManagerModalProps = {
  portalReady: boolean;
  costNames: CostName[];
  entries: BudgetEntry[];
  costCategories: BudgetCategory[];
  onClose: () => void;
  onAdd: (costName: CostName) => void;
  onUpdate: (costName: CostName, previousName: string) => void;
  onDelete: (
    id: string,
    strategy: "clear" | "reassign",
    reassignToId?: string,
  ) => void;
};

function ManagerShell({
  title,
  onClose,
  children,
  portalReady,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  portalReady: boolean;
}) {
  if (!portalReady) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function CostNamesManagerModal({
  portalReady,
  costNames,
  entries,
  costCategories,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: CostNamesManagerModalProps) {
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(
    costCategories[0]?.name ?? "",
  );
  const [newTitle, setNewTitle] = useState("");
  const [newCyclic, setNewCyclic] = useState(false);
  const [newDay, setNewDay] = useState("");
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCyclic, setEditCyclic] = useState(false);
  const [editDay, setEditDay] = useState("");
  const [editError, setEditError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("list");
  const [reassignToId, setReassignToId] = useState("");

  const sorted = useMemo(() => sortCostNames(costNames), [costNames]);

  const deleting = deleteId
    ? costNames.find((n) => n.id === deleteId)
    : undefined;
  const deleteCount = deleting
    ? countEntriesForCostName(entries, deleting)
    : 0;

  const reassignOptions = sorted.filter((n) => n.id !== deleteId);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || !newCategory) return;
    if (costNameExists(costNames, trimmed)) {
      setAddError("Nazwa kosztu już istnieje.");
      return;
    }
    const day = newDay ? Number(newDay) : undefined;
    onAdd({
      id: createCostNameId(),
      name: trimmed,
      defaultCategory: newCategory,
      defaultTransferTitle: newTitle.trim() || undefined,
      cyclic: newCyclic,
      defaultPaymentDayOfMonth:
        day && day >= 1 && day <= 31 ? day : undefined,
    });
    setNewName("");
    setNewTitle("");
    setNewCyclic(false);
    setNewDay("");
    setAddError("");
  };

  const startEdit = (cn: CostName) => {
    setEditingId(cn.id);
    setEditName(cn.name);
    setEditCategory(cn.defaultCategory);
    setEditTitle(cn.defaultTransferTitle ?? "");
    setEditCyclic(cn.cyclic);
    setEditDay(
      cn.defaultPaymentDayOfMonth != null
        ? String(cn.defaultPaymentDayOfMonth)
        : "",
    );
    setEditError("");
  };

  const saveEdit = (cn: CostName) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Nazwa nie może być pusta.");
      return;
    }
    if (costNameExists(costNames, trimmed, cn.id)) {
      setEditError("Nazwa kosztu już istnieje.");
      return;
    }
    const day = editDay ? Number(editDay) : undefined;
    onUpdate(
      {
        ...cn,
        name: trimmed,
        defaultCategory: editCategory,
        defaultTransferTitle: editTitle.trim() || undefined,
        cyclic: editCyclic,
        defaultPaymentDayOfMonth:
          day && day >= 1 && day <= 31 ? day : undefined,
      },
      cn.name,
    );
    setEditingId(null);
  };

  const startDelete = (id: string) => {
    setDeleteId(id);
    setDeleteStep("confirm");
    const firstOther = costNames.find((n) => n.id !== id);
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
      <ManagerShell
        title={
          deleteStep === "confirm"
            ? "Usuń nazwę kosztu"
            : deleteStep === "reassign"
              ? "Przypisz operacje do innej nazwy"
              : "Operacje przypisane do nazwy"
        }
        onClose={cancelDelete}
        portalReady={portalReady}
      >
        {deleteStep === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Czy na pewno usunąć tę nazwę kosztu?
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
          </div>
        )}
        {deleteStep === "strategy" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Ta nazwa kosztu ma przypisane operacje. Co zrobić z tymi
              operacjami?
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
                Zostaw operacje bez przypisanej nazwy
              </button>
              <button
                type="button"
                onClick={() => setDeleteStep("reassign")}
                disabled={reassignOptions.length === 0}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
              >
                Przenieś operacje do innej nazwy kosztu
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
        {deleteStep === "reassign" && (
          <div className="space-y-4">
            <label className="flex flex-col gap-1 text-sm text-slate-600">
              Nowa nazwa kosztu
              <select
                value={reassignToId}
                onChange={(e) => setReassignToId(e.target.value)}
                className={inputClass}
              >
                {reassignOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
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
          </div>
        )}
      </ManagerShell>
    );
  }

  return (
    <ManagerShell
      title="Nazwy kosztów i kontrahenci"
      onClose={onClose}
      portalReady={portalReady}
    >
      <p className="mb-4 text-sm text-slate-600">
        Nazwy kosztów to konkretne płatności lub kontrahenci, np. ZUS, OVH,
        Allegro, księgowość. Kategorie służą tylko do grupowania kosztów.
      </p>
      <form
        onSubmit={handleAdd}
        className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <p className="mb-3 text-sm font-semibold text-slate-700">
          Dodaj nazwę kosztu
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
              placeholder="np. ZUS"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Domyślna kategoria
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={inputClass}
            >
              {costCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600 sm:col-span-2">
            Szablon tytułu przelewu
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="np. ZUS {month}/{year}"
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newCyclic}
              onChange={(e) => setNewCyclic(e.target.checked)}
              className="rounded border-slate-300 text-sky-600"
            />
            Cykliczna
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Dzień płatności (1–31)
            <input
              type="number"
              min={1}
              max={31}
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className={inputClass}
              disabled={!newCyclic}
            />
          </label>
        </div>
        {addError && (
          <p className="mt-2 text-sm text-rose-700">{addError}</p>
        )}
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
              <th className="px-3 py-2">Cykliczny</th>
              <th className="px-3 py-2">Domyślny dzień płatności</th>
              <th className="px-3 py-2">Tytuł przelewu</th>
              <th className="px-3 py-2 text-center">Liczba operacji</th>
              <th className="px-3 py-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Brak nazw kosztów.
                </td>
              </tr>
            ) : (
              sorted.map((cn) => {
                const count = countEntriesForCostName(entries, cn);
                const isEditing = editingId === cn.id;

                return (
                  <tr key={cn.id} className="hover:bg-slate-50/80">
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
                          {cn.name}
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
                          {costCategories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        cn.defaultCategory
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editCyclic}
                          onChange={(e) => setEditCyclic(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                      ) : cn.cyclic ? (
                        "tak"
                      ) : (
                        "nie"
                      )}
                    </td>
                    <td className="px-3 py-3 align-top tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={editDay}
                          onChange={(e) => setEditDay(e.target.value)}
                          className={`${inputClass} w-16`}
                          disabled={!editCyclic}
                        />
                      ) : cn.defaultPaymentDayOfMonth != null ? (
                        cn.defaultPaymentDayOfMonth
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className={inputClass}
                        />
                      ) : (
                        cn.defaultTransferTitle || "—"
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
                            onClick={() => saveEdit(cn)}
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
                            onClick={() => startEdit(cn)}
                            className="text-xs font-medium text-sky-700 hover:underline"
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            onClick={() => startDelete(cn.id)}
                            className="text-xs font-medium text-rose-700 hover:underline"
                          >
                            Usuń
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Zamknij
        </button>
      </div>
    </ManagerShell>
  );
}

export type QuickAddCostNameModalProps = {
  portalReady: boolean;
  costNames: CostName[];
  costCategories: BudgetCategory[];
  onClose: () => void;
  onAdd: (costName: CostName) => void;
};

export function QuickAddCostNameModal({
  portalReady,
  costNames,
  costCategories,
  onClose,
  onAdd,
}: QuickAddCostNameModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(costCategories[0]?.name ?? "");
  const [title, setTitle] = useState("");
  const [cyclic, setCyclic] = useState(false);
  const [day, setDay] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !category) return;
    if (costNameExists(costNames, trimmed)) {
      setError("Nazwa kosztu już istnieje.");
      return;
    }
    const dayNum = day ? Number(day) : undefined;
    const created: CostName = {
      id: createCostNameId(),
      name: trimmed,
      defaultCategory: category,
      defaultTransferTitle: title.trim() || undefined,
      cyclic,
      defaultPaymentDayOfMonth:
        dayNum && dayNum >= 1 && dayNum <= 31 ? dayNum : undefined,
    };
    onAdd(created);
    onClose();
  };

  if (!portalReady) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Dodaj nazwę kosztu / kontrahenta
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Nazwa
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className={inputClass}
              required
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Domyślna kategoria
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {costCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Tytuł przelewu
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. ZUS {month}/{year}"
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={cyclic}
              onChange={(e) => setCyclic(e.target.checked)}
              className="rounded border-slate-300 text-sky-600"
            />
            Cykliczny
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Domyślny dzień płatności (1–31)
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={inputClass}
              disabled={!cyclic}
            />
          </label>
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Dodaj i wybierz
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
