"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { BudgetSettingsModal } from "@/components/BudgetSettingsModal";
import { QuickAddCategoryModal } from "@/components/CategoryManagerModal";
import {
  CYCLIC_FREQUENCY_OPTIONS,
  DEFAULT_CATEGORIES,
  MOCK_ENTRIES,
} from "@/data/budget-mock";
import type {
  BudgetCategory,
  BudgetEntry,
  CyclicFrequency,
  CyclicStatus,
  OperationType,
  PaymentStatus,
} from "@/data/budget-mock";
import {
  DayOperationsPanel,
  getEntriesForCalendarDay,
} from "@/components/DayOperationsPanel";
import { ActionBanner } from "@/components/ActionBanner";
import {
  AddInflowButton,
  AddInflowChoiceModal,
} from "@/components/AddInflowChoiceModal";
import { QuickAddCostNameModal } from "@/components/CostNamesManagerModal";
import {
  applyIncomeSourceDefaults,
  CUSTOM_INCOME_SOURCE_VALUE,
  findIncomeSourceById,
  IncomeSourceSelectField,
} from "@/components/IncomeSourceSelectField";
import { formatIncomeDescription } from "@/lib/income-source-utils";
import { ImportInflowsModal } from "@/components/ImportInflowsModal";
import { ManualRealInflowModal } from "@/components/ManualRealInflowModal";
import {
  OverdueDetailsPanel,
  type OverdueDetailsSelection,
} from "@/components/OverdueDetailsPanel";
import { OverduePaymentsPanel } from "@/components/OverduePaymentsPanel";
import { PendingInflowsPanel } from "@/components/PendingInflowsPanel";
import { PlanVsRealityTable } from "@/components/PlanVsRealityTable";
import {
  PaymentCalendar,
  type CalendarEmptyCellPayload,
  type CalendarOperationAmountPayload,
  type CalendarOverdueClickPayload,
} from "@/components/PaymentCalendar";
import {
  DEFAULT_COST_NAMES,
  STORAGE_COST_NAMES,
  type CostName,
} from "@/data/cost-names-mock";
import {
  DEFAULT_INCOME_SOURCES,
  STORAGE_INCOME_SOURCES,
  type IncomeSource,
} from "@/data/income-sources-mock";
import {
  MOCK_PENDING_INFLOWS,
  STORAGE_PENDING_INFLOWS,
  STORAGE_REJECTED_INFLOWS,
  type PendingInflow,
  type RejectedInflow,
} from "@/data/pending-inflows-mock";
import {
  clearCostNameOnEntries,
  createCostNameId,
  dueDateForPaymentDay,
  findCostNameById,
  findCostNameByName,
  formatTransferTitle,
  isCostName,
  migrateEntriesCostNames,
  reassignCostNameOnEntries,
  renameCostNameOnEntries,
  sortCostNames,
} from "@/lib/cost-name-utils";
import {
  clearIncomeSourceOnEntries,
  createIncomeSourceId,
  findIncomeSourceByName,
  isIncomeSource,
  migrateEntriesIncomeSources,
  reassignIncomeSourceOnEntries,
  renameIncomeSourceOnEntries,
  sortIncomeSources,
} from "@/lib/income-source-utils";
import {
  getOverdueCosts,
  getOverdueCostsForRowLabel,
  movePaymentToToday,
  normalizeCostEntryOnSave,
} from "@/lib/overdue-utils";
import {
  buildCalendarRowsFromEntries,
  computeDayTotals,
  getVisibleColumnsForPeriod,
} from "@/lib/calendar-utils";
import {
  ALL_PAYMENT_STATUSES,
  applyPaidStatus,
  applyUnpaidStatus,
  buildTableRows,
  buildEditModalTransferCopyText,
  buildTransferCopyText,
  copyTextToClipboard,
  formatAmountForClipboard,
  createEntryId,
  defaultCustomRange,
  filterEntriesByPeriod,
  filterHistoriaEntries,
  formatCurrency,
  formatDisplayDate,
  formatEntryTypeLabel,
  formatOperationTypeLabel,
  getPeriodRange,
  getTodayDateInputValue,
  migrateLegacyEntry,
  operationTypeColorClass,
  pendingInflowToEntry,
  PAYMENT_STATUS_STYLES,
  setEntryPaymentStatus,
  sortEntries,
  type OperationTypeFilter,
  type PaymentStatusFilter,
  type PeriodFilter,
} from "@/lib/budget-utils";
import {
  applyDeleteCategoryStrategy,
  filterCategoriesForEntryType,
  findCategoryByName,
  formatCategoryDisplayName,
  getCategoryBadgeClassName,
  getCategoryDotClassName,
  getCategoryDotStyle,
  migrateStoredCategory,
  renameCategoryOnEntries,
} from "@/lib/category-utils";
import { mergeImportedPendingInflows } from "@/lib/pending-inflow-utils";

const STORAGE_ENTRIES = "vunqo-budget-entries";
const STORAGE_CATEGORIES = "vunqo-budget-categories";

function parseStoredEntry(value: unknown): BudgetEntry | null {
  return migrateLegacyEntry(value);
}

function isBudgetCategory(value: unknown): value is BudgetCategory {
  if (!value || typeof value !== "object") return false;
  const c = value as BudgetCategory;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    (c.type === "koszt" ||
      c.type === "planowany przychód" ||
      c.type === "oba" ||
      (c as { type: string }).type === "przychód") &&
    (typeof c.color === "string" || c.color === undefined)
  );
}

function loadStoredEntries(): BudgetEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_ENTRIES);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed
      .map(parseStoredEntry)
      .filter((e): e is BudgetEntry => e != null);
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function loadStoredCategories(): BudgetCategory[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORIES);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed
      .filter(isBudgetCategory)
      .map((c) => migrateStoredCategory(c));
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

const PAYMENT_STATUS_FILTER_OPTIONS: {
  value: PaymentStatusFilter;
  label: string;
}[] = [
  { value: "wszystkie", label: "Wszystkie" },
  { value: "do zapłaty", label: "Do zapłaty" },
  { value: "zapłacone", label: "Zapłacone" },
  { value: "po terminie", label: "Po terminie" },
  { value: "cykliczne", label: "Cykliczne" },
  { value: "wymaga potwierdzenia", label: "Wymaga potwierdzenia" },
];

const OPERATION_TYPE_FILTER_OPTIONS: {
  value: OperationTypeFilter;
  label: string;
}[] = [
  { value: "wszystko", label: "Wszystko" },
  { value: "koszt", label: "Koszt" },
  { value: "planowany wpływ", label: "Planowany przychód" },
  { value: "rzeczywisty wpływ", label: "Rzeczywisty wpływ" },
  { value: "wpływ do akceptacji", label: "Wpływ do akceptacji" },
];

const CYCLIC_STATUS_STYLES: Record<CyclicStatus, string> = {
  "kwota potwierdzona": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "wymaga potwierdzenia": "bg-amber-50 text-amber-800 ring-amber-200",
  "zmieniona kwota": "bg-sky-50 text-sky-800 ring-sky-200",
};

type ModalKind =
  | "cost"
  | "revenue"
  | "manualReal"
  | "import"
  | "edit"
  | null;

type CalendarCostPrefill = {
  date: string;
  dueDate: string;
  rowLabel: string;
};

type CalendarIncomePrefill = {
  date: string;
  rowLabel: string;
};

const CUSTOM_COST_NAME_VALUE = "__custom__";

function isPendingInflow(value: unknown): value is PendingInflow {
  if (!value || typeof value !== "object") return false;
  const p = value as PendingInflow;
  return (
    typeof p.id === "string" &&
    typeof p.date === "string" &&
    typeof p.name === "string" &&
    typeof p.amount === "number" &&
    typeof p.source === "string" &&
    typeof p.category === "string"
  );
}

function loadStoredPending(): PendingInflow[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_PENDING_INFLOWS);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(isPendingInflow);
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function loadStoredCostNames(): CostName[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_COST_NAMES);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(isCostName);
    return valid.length > 0 ? sortCostNames(valid) : null;
  } catch {
    return null;
  }
}

function loadStoredIncomeSources(): IncomeSource[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_INCOME_SOURCES);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(isIncomeSource);
    return valid.length > 0 ? sortIncomeSources(valid) : null;
  } catch {
    return null;
  }
}

function loadStoredRejected(): RejectedInflow[] {
  try {
    const raw = localStorage.getItem(STORAGE_REJECTED_INFLOWS);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPendingInflow);
  } catch {
    return [];
  }
}

function StatusBadge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

function CopyTransferButton({
  entry,
  copied,
  onCopied,
}: {
  entry: BudgetEntry;
  copied: boolean;
  onCopied: () => void;
}) {
  const handleCopy = async () => {
    const text = buildTransferCopyText(entry);
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      /* fallback for older browsers */
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onCopied();
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
    >
      {copied ? "Skopiowano" : "Kopiuj do przelewu"}
    </button>
  );
}

export default function BudgetPage() {
  const [period, setPeriod] = useState<PeriodFilter>("current-period");
  const [customStart, setCustomStart] = useState(() =>
    defaultCustomRange().start,
  );
  const [customEnd, setCustomEnd] = useState(() => defaultCustomRange().end);
  const [entries, setEntries] = useState<BudgetEntry[]>(MOCK_ENTRIES);
  const [categories, setCategories] =
    useState<BudgetCategory[]>(DEFAULT_CATEGORIES);
  const [hydrated, setHydrated] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [costModalPrefill, setCostModalPrefill] =
    useState<CalendarCostPrefill | null>(null);
  const [revenueModalPrefill, setRevenueModalPrefill] =
    useState<CalendarIncomePrefill | null>(null);
  const [manualRealModalPrefill, setManualRealModalPrefill] =
    useState<CalendarIncomePrefill | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("wszystkie");
  const [operationTypeFilter, setOperationTypeFilter] =
    useState<OperationTypeFilter>("wszystko");
  const [pendingInflows, setPendingInflows] =
    useState<PendingInflow[]>(MOCK_PENDING_INFLOWS);
  const [rejectedInflows, setRejectedInflows] = useState<RejectedInflow[]>([]);
  const [historiaDateFrom, setHistoriaDateFrom] = useState("");
  const [historiaDateTo, setHistoriaDateTo] = useState("");
  const [historiaSpecificDay, setHistoriaSpecificDay] = useState("");
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(
    null,
  );
  const [overdueSelection, setOverdueSelection] =
    useState<OverdueDetailsSelection | null>(null);
  const [historiaCategory, setHistoriaCategory] = useState("");
  const [historiaCostName, setHistoriaCostName] = useState("");
  const [costNames, setCostNames] = useState<CostName[]>(DEFAULT_COST_NAMES);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(
    DEFAULT_INCOME_SOURCES,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pendingSectionRef = useRef<HTMLDivElement>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [addInflowChoiceOpen, setAddInflowChoiceOpen] = useState(false);

  useEffect(() => {
    const storedEntries = loadStoredEntries();
    const storedCategories = loadStoredCategories();
    const storedPending = loadStoredPending();
    const storedCostNames = loadStoredCostNames();
    const storedIncomeSources = loadStoredIncomeSources();
    const names = storedCostNames ?? DEFAULT_COST_NAMES;
    const sources = storedIncomeSources ?? DEFAULT_INCOME_SOURCES;
    setCostNames(names);
    setIncomeSources(sources);
    if (storedEntries) {
      const migrated = migrateEntriesIncomeSources(
        migrateEntriesCostNames(storedEntries, names),
        sources,
      );
      setEntries(sortEntries(migrated));
    } else {
      const migrated = migrateEntriesIncomeSources(
        migrateEntriesCostNames(MOCK_ENTRIES, names),
        sources,
      );
      setEntries(sortEntries(migrated));
    }
    if (storedCategories) setCategories(storedCategories);
    if (storedPending) setPendingInflows(storedPending);
    setRejectedInflows(loadStoredRejected());
    setHydrated(true);
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_ENTRIES, JSON.stringify(entries));
  }, [entries, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories));
  }, [categories, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_PENDING_INFLOWS,
      JSON.stringify(pendingInflows),
    );
  }, [pendingInflows, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_REJECTED_INFLOWS,
      JSON.stringify(rejectedInflows),
    );
  }, [rejectedInflows, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_COST_NAMES, JSON.stringify(costNames));
  }, [costNames, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_INCOME_SOURCES,
      JSON.stringify(incomeSources),
    );
  }, [incomeSources, hydrated]);

  useEffect(() => {
    setSelectedDateIso(null);
    setSelectedOperationId(null);
  }, [period, customStart, customEnd]);

  const range = useMemo(
    () => getPeriodRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const filtered = useMemo(() => {
    if (period === "custom" && (!customStart || !customEnd)) {
      return [];
    }
    return filterEntriesByPeriod(entries, range);
  }, [entries, range, period, customStart, customEnd]);

  const historiaFiltered = useMemo(
    () =>
      filterHistoriaEntries(entries, {
        specificDay: historiaSpecificDay || undefined,
        dateFrom: historiaSpecificDay ? undefined : historiaDateFrom || undefined,
        dateTo: historiaSpecificDay ? undefined : historiaDateTo || undefined,
        periodRange: range,
        paymentStatus: paymentStatusFilter,
        entryType: operationTypeFilter,
        category: historiaCategory || undefined,
        costName: historiaCostName || undefined,
      }),
    [
      entries,
      range,
      paymentStatusFilter,
      operationTypeFilter,
      historiaDateFrom,
      historiaDateTo,
      historiaSpecificDay,
      historiaCategory,
      historiaCostName,
    ],
  );

  const tableRows = useMemo(
    () => buildTableRows(historiaFiltered, entries),
    [historiaFiltered, entries],
  );

  const handleSelectDate = useCallback((dateIso: string) => {
    setSelectedDateIso(dateIso);
    setSelectedOperationId(null);
    setOverdueSelection(null);
  }, []);

  const handleOverdueColumnClick = useCallback(
    (payload: CalendarOverdueClickPayload) => {
      setOverdueSelection(payload);
      setSelectedDateIso(null);
      setSelectedOperationId(null);
    },
    [],
  );

  const openEditEntry = useCallback((entry: BudgetEntry) => {
    setEditingEntry(entry);
    setModal("edit");
  }, []);

  const handleOperationAmountClick = useCallback(
    ({
      entryId,
      dateIso,
      paymentCountInCell,
    }: CalendarOperationAmountPayload) => {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return;

      if (paymentCountInCell === 1) {
        openEditEntry(entry);
        return;
      }

      setSelectedDateIso(dateIso);
      setSelectedOperationId(entryId);
    },
    [entries, openEditEntry],
  );

  const closeModal = useCallback(() => {
    setModal(null);
    setCostModalPrefill(null);
    setRevenueModalPrefill(null);
    setManualRealModalPrefill(null);
  }, []);

  const handleEmptyCalendarCellClick = useCallback(
    ({ rowType, rowLabel, dateIso }: CalendarEmptyCellPayload) => {
      if (rowType === "koszt") {
        setCostModalPrefill({
          date: dateIso,
          dueDate: dateIso,
          rowLabel,
        });
        setModal("cost");
        return;
      }
      if (rowType === "planowany wpływ") {
        setRevenueModalPrefill({ date: dateIso, rowLabel });
        setModal("revenue");
        return;
      }
      if (rowType === "rzeczywisty wpływ") {
        setManualRealModalPrefill({ date: dateIso, rowLabel });
        setModal("manualReal");
      }
    },
    [],
  );

  const openCostModal = useCallback(() => {
    setCostModalPrefill(null);
    setModal("cost");
  }, []);

  const addEntry = useCallback((entry: BudgetEntry) => {
    setEntries((prev) => sortEntries([...prev, entry]));
    setModal(null);
  }, []);

  const addCategory = useCallback((category: BudgetCategory) => {
    setCategories((prev) => [...prev, category]);
  }, []);

  const updateCategory = useCallback(
    (updated: BudgetCategory, previousName: string) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      if (previousName !== updated.name) {
        setEntries((prev) =>
          sortEntries(renameCategoryOnEntries(prev, previousName, updated.name)),
        );
      }
    },
    [],
  );

  const deleteCategory = useCallback(
    (id: string, strategy: "move-to-other" | "clear-category") => {
      setCategories((prev) => {
        const cat = prev.find((c) => c.id === id);
        if (!cat) return prev;
        setEntries((entriesPrev) =>
          sortEntries(
            applyDeleteCategoryStrategy(entriesPrev, cat.name, strategy),
          ),
        );
        return prev.filter((c) => c.id !== id);
      });
    },
    [],
  );

  const confirmCyclic = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, cyclicStatus: "kwota potwierdzona" as const }
          : e,
      ),
    );
  }, []);

  const updateEntry = useCallback((updated: BudgetEntry) => {
    setEntries((prev) =>
      sortEntries(
        prev.map((e) =>
          e.id === updated.id ? normalizeCostEntryOnSave(updated, e) : e,
        ),
      ),
    );
    setEditingEntry(null);
    setModal(null);
  }, []);

  useEffect(() => {
    if (!overdueSelection) return;
    const list =
      overdueSelection.scope === "all"
        ? getOverdueCosts(entries)
        : getOverdueCostsForRowLabel(entries, overdueSelection.rowLabel);
    if (list.length === 0) setOverdueSelection(null);
  }, [entries, overdueSelection]);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const deleteEntryFromModal = useCallback(
    (id: string) => {
      deleteEntry(id);
      setEditingEntry(null);
      setModal(null);
      setSelectedOperationId((current) => (current === id ? null : current));
    },
    [deleteEntry],
  );

  const clearTestData = useCallback(() => {
    setEntries([]);
    setPendingInflows([]);
    setRejectedInflows([]);
    setSelectedDateIso(null);
    setSelectedOperationId(null);
    setOverdueSelection(null);
    setEditingEntry(null);
    setModal(null);
    localStorage.removeItem(STORAGE_ENTRIES);
    localStorage.removeItem(STORAGE_PENDING_INFLOWS);
    localStorage.removeItem(STORAGE_REJECTED_INFLOWS);
    setActionMessage(
      "Wyczyszczono dane operacji. Kategorie i słowniki pozostały bez zmian.",
    );
  }, []);

  const acceptPendingInflows = useCallback((ids: string[]) => {
    const toAccept = pendingInflows.filter((p) => ids.includes(p.id));
    if (toAccept.length === 0) return;
    setEntries((prev) =>
      sortEntries([
        ...prev,
        ...toAccept.map((p) => pendingInflowToEntry(p)),
      ]),
    );
    setPendingInflows((prev) => prev.filter((p) => !ids.includes(p.id)));
    setActionMessage(
      `Zaakceptowano ${toAccept.length} wpływy jako rzeczywiste`,
    );
  }, [pendingInflows]);

  const rejectPendingInflows = useCallback((ids: string[]) => {
    const toReject = pendingInflows
      .filter((p) => ids.includes(p.id))
      .map((p) => ({ ...p, importStatus: "odzucony" as const }));
    if (toReject.length === 0) return;
    setRejectedInflows((prev) => [...toReject, ...prev]);
    setPendingInflows((prev) => prev.filter((p) => !ids.includes(p.id)));
    setActionMessage(`Odrzucono ${toReject.length} pozycje`);
  }, [pendingInflows]);

  const updatePendingCategory = useCallback(
    (ids: string[], category: string) => {
      setPendingInflows((prev) =>
        prev.map((p) =>
          ids.includes(p.id)
            ? { ...p, category, suggestedCategory: category }
            : p,
        ),
      );
    },
    [],
  );

  const editPendingInflow = useCallback((updated: PendingInflow) => {
    setPendingInflows((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p)),
    );
  }, []);

  const scrollToPendingSection = useCallback(() => {
    pendingSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const importStatementInflows = useCallback(
    (incoming: PendingInflow[]) => {
      setPendingInflows((prev) => {
        const { merged, addedCount } = mergeImportedPendingInflows(
          prev,
          incoming,
        );
        if (addedCount > 0) {
          setActionMessage(`Dodano ${addedCount} pozycji do akceptacji.`);
        } else if (incoming.length > 0) {
          setActionMessage(
            "Wszystkie pozycje były już na liście do akceptacji.",
          );
        }
        return merged;
      });
      setModal(null);
      scrollToPendingSection();
    },
    [scrollToPendingSection],
  );

  const addCostName = useCallback((costName: CostName) => {
    setCostNames((prev) => sortCostNames([...prev, costName]));
  }, []);

  const updateCostName = useCallback(
    (updated: CostName, previousName: string) => {
      setCostNames((prev) =>
        sortCostNames(
          prev.map((n) => (n.id === updated.id ? updated : n)),
        ),
      );
      if (previousName !== updated.name) {
        setEntries((prev) =>
          sortEntries(
            renameCostNameOnEntries(
              prev,
              previousName,
              updated.name,
              updated.id,
            ),
          ),
        );
      }
    },
    [],
  );

  const deleteCostName = useCallback(
    (id: string, strategy: "clear" | "reassign", reassignToId?: string) => {
      setCostNames((prevNames) => {
        const removed = prevNames.find((n) => n.id === id);
        if (!removed) return prevNames;
        const target =
          strategy === "reassign" && reassignToId
            ? prevNames.find((n) => n.id === reassignToId)
            : undefined;
        const nextNames = prevNames.filter((n) => n.id !== id);
        setEntries((entriesPrev) => {
          if (target) {
            return sortEntries(
              reassignCostNameOnEntries(entriesPrev, removed, target),
            );
          }
          return sortEntries(clearCostNameOnEntries(entriesPrev, removed));
        });
        return nextNames;
      });
    },
    [],
  );

  const addIncomeSource = useCallback((source: IncomeSource) => {
    setIncomeSources((prev) => sortIncomeSources([...prev, source]));
  }, []);

  const updateIncomeSource = useCallback(
    (updated: IncomeSource, previousName: string) => {
      setIncomeSources((prev) =>
        sortIncomeSources(
          prev.map((s) => (s.id === updated.id ? updated : s)),
        ),
      );
      if (previousName !== updated.name) {
        setEntries((prev) =>
          sortEntries(
            renameIncomeSourceOnEntries(
              prev,
              previousName,
              updated.name,
              updated.id,
            ),
          ),
        );
      }
    },
    [],
  );

  const deleteIncomeSource = useCallback(
    (id: string, strategy: "clear" | "reassign", reassignToId?: string) => {
      setIncomeSources((prevSources) => {
        const removed = prevSources.find((s) => s.id === id);
        if (!removed) return prevSources;
        const target =
          strategy === "reassign" && reassignToId
            ? prevSources.find((s) => s.id === reassignToId)
            : undefined;
        const nextSources = prevSources.filter((s) => s.id !== id);
        setEntries((entriesPrev) => {
          if (target) {
            return sortEntries(
              reassignIncomeSourceOnEntries(entriesPrev, removed, target),
            );
          }
          return sortEntries(clearIncomeSourceOnEntries(entriesPrev, removed));
        });
        return nextSources;
      });
    },
    [],
  );

  const markEntryPaid = useCallback((id: string) => {
    setEntries((prev) =>
      sortEntries(
        prev.map((e) => (e.id === id ? applyPaidStatus(e) : e)),
      ),
    );
  }, []);

  const moveEntryToToday = useCallback((entry: BudgetEntry) => {
    setEntries((prev) =>
      sortEntries(
        prev.map((e) =>
          e.id === entry.id ? movePaymentToToday(e) : e,
        ),
      ),
    );
    setActionMessage(`Przeniesiono płatność „${entry.name}” na dziś.`);
  }, []);

  const markEntryUnpaid = useCallback((id: string) => {
    setEntries((prev) =>
      sortEntries(
        prev.map((e) => (e.id === id ? applyUnpaidStatus(e) : e)),
      ),
    );
  }, []);

  const changeEntryStatus = useCallback((id: string, status: PaymentStatus) => {
    setEntries((prev) =>
      sortEntries(
        prev.map((e) =>
          e.id === id ? setEntryPaymentStatus(e, status) : e,
        ),
      ),
    );
  }, []);

  const calendarDayTotals = useMemo(() => {
    const columns = getVisibleColumnsForPeriod(
      period,
      customStart,
      customEnd,
    );
    const calendarRows = buildCalendarRowsFromEntries(entries, range);
    const totals = computeDayTotals(calendarRows, columns);
    const map = new Map<string, (typeof totals)[number]>();
    for (const t of totals) map.set(t.dateIso, t);
    return map;
  }, [entries, period, customStart, customEnd, range]);

  const selectedDayEntries = useMemo(
    () =>
      selectedDateIso != null
        ? getEntriesForCalendarDay(entries, selectedDateIso)
        : [],
    [entries, selectedDateIso],
  );

  const selectedOperation = useMemo(
    () =>
      selectedOperationId
        ? entries.find((e) => e.id === selectedOperationId)
        : undefined,
    [entries, selectedOperationId],
  );

  const selectedDayTotals =
    selectedDateIso != null
      ? calendarDayTotals.get(selectedDateIso)
      : undefined;

  const costCategories = useMemo(
    () =>
      categories.filter((c) => c.type === "koszt" || c.type === "oba"),
    [categories],
  );

  const revenueCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.type === "planowany przychód" || c.type === "oba",
      ),
    [categories],
  );

  const historiaCategoryOptions = useMemo(() => {
    const names = new Set<string>();
    for (const e of entries) {
      if (e.category.trim()) names.add(e.category);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "pl"));
  }, [entries]);

  const historiaCostNameOptions = useMemo(() => {
    const names = new Set<string>();
    for (const e of entries) {
      if (e.type !== "koszt") continue;
      const label = e.costName?.trim() || e.name;
      if (label) names.add(label);
    }
    for (const cn of costNames) names.add(cn.name);
    return [...names].sort((a, b) => a.localeCompare(b, "pl"));
  }, [entries, costNames]);

  if (!hydrated) {
    return (
      <div className="min-h-full bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              VUNQO
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Budżet
            </h1>
          </header>
          <p className="text-sm text-slate-500">Ładowanie danych…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            VUNQO
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Budżet
          </h1>
        </header>

        <OverduePaymentsPanel
          entries={entries}
          onEditEntry={openEditEntry}
          onMarkPaid={markEntryPaid}
          onMoveToToday={moveEntryToToday}
        />

        <section className="mb-4 flex flex-wrap items-center gap-3">
          <ActionButton variant="rose" onClick={openCostModal}>
            Dodaj koszt
          </ActionButton>
          <AddInflowButton onClick={() => setAddInflowChoiceOpen(true)} />
          <ActionButton variant="slate" onClick={() => setSettingsOpen(true)}>
            Ustawienia budżetu
          </ActionButton>
        </section>

        <ActionBanner
          message={actionMessage}
          onDismiss={() => setActionMessage(null)}
        />

        <PaymentCalendar
          entries={entries}
          period={period}
          customStart={customStart}
          customEnd={customEnd}
          onPeriodChange={setPeriod}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          selectedDateIso={selectedDateIso}
          selectedOperationId={selectedOperationId}
          onSelectDate={handleSelectDate}
          onOperationAmountClick={handleOperationAmountClick}
          onEmptyCalendarCellClick={handleEmptyCalendarCellClick}
          onOverdueColumnClick={handleOverdueColumnClick}
          overdueDetails={
            overdueSelection ? (
              <OverdueDetailsPanel
                selection={overdueSelection}
                entries={entries}
                onEditEntry={openEditEntry}
                onMarkPaid={markEntryPaid}
                onMoveToToday={moveEntryToToday}
                onClose={() => setOverdueSelection(null)}
              />
            ) : null
          }
          dayOperations={
            selectedDateIso != null ? (
              <DayOperationsPanel
                embedded
                dateIso={selectedDateIso}
                dayEntries={selectedDayEntries}
                selectedOperation={selectedOperation ?? null}
                totals={selectedDayTotals}
                onEditEntry={openEditEntry}
                onDeleteEntry={deleteEntry}
                onMarkPaid={markEntryPaid}
              />
            ) : null
          }
        />

        <div ref={pendingSectionRef}>
          <PendingInflowsPanel
            pending={pendingInflows}
            rejected={rejectedInflows}
            categories={categories}
            revenueCategories={revenueCategories}
            portalReady={portalReady}
            onAccept={acceptPendingInflows}
            onReject={rejectPendingInflows}
            onUpdateCategory={updatePendingCategory}
            onEdit={editPendingInflow}
            onAdd={() => {}}
          />
        </div>

        <PlanVsRealityTable entries={entries} range={range} />

        <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-800">
              Historia operacji
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {historiaFiltered.length} z {entries.length} pozycji (bez lokalnych
              dat — zakres z wybranego okresu u góry)
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Od daty
                <input
                  type="date"
                  value={historiaDateFrom}
                  onChange={(e) => {
                    setHistoriaDateFrom(e.target.value);
                    if (e.target.value) setHistoriaSpecificDay("");
                  }}
                  disabled={Boolean(historiaSpecificDay)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Do daty
                <input
                  type="date"
                  value={historiaDateTo}
                  onChange={(e) => {
                    setHistoriaDateTo(e.target.value);
                    if (e.target.value) setHistoriaSpecificDay("");
                  }}
                  disabled={Boolean(historiaSpecificDay)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Konkretny dzień
                <input
                  type="date"
                  value={historiaSpecificDay}
                  onChange={(e) => {
                    setHistoriaSpecificDay(e.target.value);
                    if (e.target.value) {
                      setHistoriaDateFrom("");
                      setHistoriaDateTo("");
                    }
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="w-full text-xs font-medium uppercase tracking-wide text-slate-500">
                Status płatności
              </span>
              {PAYMENT_STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentStatusFilter(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    paymentStatusFilter === opt.value
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Kategoria
                <select
                  value={historiaCategory}
                  onChange={(e) => setHistoriaCategory(e.target.value)}
                  className="max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">Wszystkie kategorie</option>
                  {historiaCategoryOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-600">
                Nazwa kosztu / kontrahent
                <select
                  value={historiaCostName}
                  onChange={(e) => setHistoriaCostName(e.target.value)}
                  className="max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">Wszystkie nazwy</option>
                  {historiaCostNameOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="w-full text-xs font-medium uppercase tracking-wide text-slate-500">
                Typ
              </span>
              {OPERATION_TYPE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOperationTypeFilter(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    operationTypeFilter === opt.value
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-base">
              <thead className="bg-slate-50 text-sm font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-4 sm:px-6">Data</th>
                  <th className="px-4 py-4 sm:px-6">Nazwa</th>
                  <th className="px-4 py-4 sm:px-6">Kategoria</th>
                  <th className="px-4 py-4 sm:px-6">Typ</th>
                  <th className="px-4 py-4 sm:px-6 text-right">Kwota</th>
                  <th className="px-4 py-4 sm:px-6">Status płatności</th>
                  <th className="px-4 py-4 sm:px-6">
                    Numer faktury / tytuł przelewu
                  </th>
                  <th className="px-4 py-4 sm:px-6">Termin płatności</th>
                  <th className="px-4 py-4 sm:px-6">Data zapłaty</th>
                  <th className="px-4 py-4 sm:px-6">Cykliczna</th>
                  <th className="min-w-[14rem] px-4 py-4 sm:px-6">Akcje</th>
                  <th className="px-4 py-4 sm:px-6 text-right">Bilans dnia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Brak pozycji dla wybranych filtrów.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700 sm:px-6">
                        {formatDisplayDate(row.date)}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900 sm:px-6">
                        {row.name}
                      </td>
                      <td className="px-4 py-4 text-slate-600 sm:px-6">
                        <CategoryTableCell
                          name={row.category}
                          categories={categories}
                        />
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span
                          className={`font-medium ${operationTypeColorClass(row.type)}`}
                        >
                          {formatOperationTypeLabel(row.type)}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums sm:px-6 ${operationTypeColorClass(row.type)}`}
                      >
                        {row.type === "koszt" ? "−" : "+"}
                        {formatCurrency(row.amount).replace(" zł", "")} zł
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <StatusBadge
                          className={
                            PAYMENT_STATUS_STYLES[row.paymentStatus] ??
                            "bg-slate-100 text-slate-700 ring-slate-200"
                          }
                        >
                          {row.paymentStatus}
                        </StatusBadge>
                        {row.cyclic && row.cyclicStatus && (
                          <span className="mt-1 block">
                            <StatusBadge
                              className={
                                CYCLIC_STATUS_STYLES[row.cyclicStatus] ??
                                "bg-slate-100 text-slate-700 ring-slate-200"
                              }
                            >
                              {row.cyclicStatus}
                            </StatusBadge>
                          </span>
                        )}
                      </td>
                      <td className="max-w-[14rem] px-4 py-4 text-sm text-slate-700 sm:px-6">
                        {row.invoiceRef?.trim() ? (
                          row.invoiceRef
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700 sm:px-6">
                        {formatDisplayDate(row.dueDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700 sm:px-6">
                        {row.paidDate ? (
                          formatDisplayDate(row.paidDate)
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        {row.cyclic ? (
                          <span className="font-medium text-sky-700">Tak</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <EntryRowActions
                          entry={row}
                          copyFeedbackId={copyFeedbackId}
                          onCopyFeedback={(id) => {
                            setCopyFeedbackId(id);
                            window.setTimeout(
                              () =>
                                setCopyFeedbackId((current) =>
                                  current === id ? null : current,
                                ),
                              2000,
                            );
                          }}
                          onEdit={() => openEditEntry(row)}
                          onDelete={() => deleteEntry(row.id)}
                          onMarkPaid={() => markEntryPaid(row.id)}
                          onMarkUnpaid={() => markEntryUnpaid(row.id)}
                          onStatusChange={(status) =>
                            changeEntryStatus(row.id, status)
                          }
                        />
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-4 text-right font-medium tabular-nums sm:px-6 ${
                          row.dailyBalance >= 0
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {formatCurrency(row.dailyBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {addInflowChoiceOpen && (
        <AddInflowChoiceModal
          portalReady={portalReady}
          onClose={() => setAddInflowChoiceOpen(false)}
          onPlanned={() => {
            setAddInflowChoiceOpen(false);
            setRevenueModalPrefill(null);
            setModal("revenue");
          }}
          onManual={() => {
            setAddInflowChoiceOpen(false);
            setManualRealModalPrefill(null);
            setModal("manualReal");
          }}
          onImport={() => {
            setAddInflowChoiceOpen(false);
            setModal("import");
          }}
        />
      )}
      {modal === "cost" && (
        <AddCostModal
          key={
            costModalPrefill
              ? `cost-${costModalPrefill.date}-${costModalPrefill.rowLabel}`
              : "cost-default"
          }
          portalReady={portalReady}
          categories={costCategories}
          allCategories={categories}
          costNames={costNames}
          initial={costModalPrefill ?? undefined}
          onClose={closeModal}
          onSubmit={addEntry}
          onAddCategory={addCategory}
          onAddCostName={addCostName}
        />
      )}
      {modal === "revenue" && (
        <AddRevenueModal
          key={
            revenueModalPrefill
              ? `revenue-${revenueModalPrefill.date}-${revenueModalPrefill.rowLabel}`
              : "revenue-default"
          }
          portalReady={portalReady}
          categories={revenueCategories}
          allCategories={categories}
          incomeSources={incomeSources}
          title="Dodaj planowany wpływ"
          initial={revenueModalPrefill ?? undefined}
          onClose={closeModal}
          onSubmit={addEntry}
          onAddCategory={addCategory}
          onAddIncomeSource={addIncomeSource}
        />
      )}
      {modal === "manualReal" && (
        <ManualRealInflowModal
          key={
            manualRealModalPrefill
              ? `manual-${manualRealModalPrefill.date}-${manualRealModalPrefill.rowLabel}`
              : "manual-default"
          }
          portalReady={portalReady}
          categories={revenueCategories}
          allCategories={categories}
          incomeSources={incomeSources}
          initial={manualRealModalPrefill ?? undefined}
          onClose={closeModal}
          onSubmit={addEntry}
          onAddCategory={addCategory}
          onAddIncomeSource={addIncomeSource}
        />
      )}
      {modal === "import" && (
        <ImportInflowsModal
          portalReady={portalReady}
          existingPending={pendingInflows}
          entries={entries}
          rejected={rejectedInflows}
          onClose={closeModal}
          onConfirm={importStatementInflows}
        />
      )}
      {settingsOpen && (
        <BudgetSettingsModal
          portalReady={portalReady}
          categories={categories}
          entries={entries}
          costNames={costNames}
          incomeSources={incomeSources}
          costCategories={costCategories}
          revenueCategories={revenueCategories}
          onClose={() => setSettingsOpen(false)}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onAddCostName={addCostName}
          onUpdateCostName={updateCostName}
          onDeleteCostName={deleteCostName}
          onAddIncomeSource={addIncomeSource}
          onUpdateIncomeSource={updateIncomeSource}
          onDeleteIncomeSource={deleteIncomeSource}
          onConfirmCyclic={confirmCyclic}
          onDeleteEntry={deleteEntry}
          onClearTestData={clearTestData}
        />
      )}
      {modal === "edit" && editingEntry && (
        <EditEntryModal
          portalReady={portalReady}
          entry={editingEntry}
          categories={categories}
          allCategories={categories}
          onClose={() => {
            setEditingEntry(null);
            closeModal();
          }}
          onSubmit={updateEntry}
          onDelete={deleteEntryFromModal}
          onAddCategory={addCategory}
        />
      )}
    </div>
  );
}

function EntryRowActions({
  entry,
  copyFeedbackId,
  onCopyFeedback,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkUnpaid,
  onStatusChange,
}: {
  entry: BudgetEntry;
  copyFeedbackId: string | null;
  onCopyFeedback: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onStatusChange: (status: PaymentStatus) => void;
}) {
  const actionClass =
    "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800";

  return (
    <div className="flex min-w-[12rem] flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={onEdit} className={actionClass}>
          Edytuj
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50"
        >
          Usuń
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {entry.paymentStatus !== "zapłacone" ? (
          <button
            type="button"
            onClick={onMarkPaid}
            className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs font-medium text-emerald-800 shadow-sm hover:bg-emerald-50"
          >
            Oznacz jako zapłacone
          </button>
        ) : (
          <button
            type="button"
            onClick={onMarkUnpaid}
            className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs font-medium text-sky-800 shadow-sm hover:bg-sky-50"
          >
            Oznacz jako niezapłacone
          </button>
        )}
      </div>
      <label className="flex flex-col gap-0.5 text-xs text-slate-500">
        Zmień status
        <select
          value={entry.paymentStatus}
          onChange={(e) => onStatusChange(e.target.value as PaymentStatus)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          {ALL_PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <CopyTransferButton
        entry={entry}
        copied={copyFeedbackId === entry.id}
        onCopied={() => onCopyFeedback(entry.id)}
      />
    </div>
  );
}

function ActionButton({
  children,
  variant,
  onClick,
}: {
  children: ReactNode;
  variant: "rose" | "emerald" | "slate" | "sky" | "amber";
  onClick: () => void;
}) {
  const styles = {
    rose: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    slate: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    sky: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
    amber:
      "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function ModalShell({
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
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h3>
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

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200";

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      {label}
      {children}
    </label>
  );
}

function CategoryTableCell({
  name,
  categories,
}: {
  name: string;
  categories: BudgetCategory[];
}) {
  const display = formatCategoryDisplayName(name);
  const cat = name ? findCategoryByName(categories, name) : undefined;

  if (!cat) {
    return <span className="text-slate-600">{display}</span>;
  }

  return (
    <span className={getCategoryBadgeClassName(cat.color)}>
      <span
        className={getCategoryDotClassName(cat.color)}
        style={getCategoryDotStyle(cat.color)}
        aria-hidden
      />
      {display}
    </span>
  );
}

function CategorySelectField({
  label,
  categories,
  allCategories,
  value,
  onChange,
  formType,
  emptyMessage,
  portalReady,
  onAddCategory,
}: {
  label: string;
  categories: BudgetCategory[];
  allCategories: BudgetCategory[];
  value: string;
  onChange: (name: string) => void;
  formType: "koszt" | "planowany przychód";
  emptyMessage: string;
  portalReady: boolean;
  onAddCategory: (category: BudgetCategory) => void;
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <label className="flex flex-col gap-1 text-sm text-slate-600">
        {label}
        {categories.length === 0 ? (
          <p className="text-sm text-amber-700">{emptyMessage}</p>
        ) : (
          <div className="flex gap-2">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
              required={Boolean(value) || categories.length > 0}
            >
              {!value && <option value="">—</option>}
              {value &&
                !categories.some((c) => c.name === value) && (
                  <option value={value}>{value}</option>
                )}
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              title="Dodaj kategorię"
              onClick={() => setQuickAddOpen(true)}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-medium text-sky-700 shadow-sm hover:border-sky-400 hover:bg-sky-50"
            >
              +
            </button>
          </div>
        )}
      </label>
      {quickAddOpen && (
        <QuickAddCategoryModal
          portalReady={portalReady}
          presetType={formType}
          categories={allCategories}
          onClose={() => setQuickAddOpen(false)}
          onAdd={(category) => {
            onAddCategory(category);
            onChange(category.name);
          }}
        />
      )}
    </>
  );
}

function CyclicFrequencyField({
  value,
  onChange,
}: {
  value: CyclicFrequency;
  onChange: (value: CyclicFrequency) => void;
}) {
  return (
    <FormField label="Cykliczność">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as CyclicFrequency)}
        className={inputClass}
      >
        {CYCLIC_FREQUENCY_OPTIONS.map((freq) => (
          <option key={freq} value={freq}>
            {freq}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function applyCostNameDefaults(
  cn: CostName,
  setters: {
    setName: (v: string) => void;
    setCategory: (v: string) => void;
    setInvoiceRef: (v: string) => void;
    setCyclic: (v: boolean) => void;
    setDueDate: (v: string) => void;
    setPaymentStatus: (v: PaymentStatus) => void;
  },
) {
  setters.setName(cn.name);
  setters.setCategory(cn.defaultCategory);
  setters.setInvoiceRef(formatTransferTitle(cn.defaultTransferTitle));
  setters.setCyclic(cn.cyclic);
  if (cn.defaultPaymentDayOfMonth != null) {
    setters.setDueDate(dueDateForPaymentDay(cn.defaultPaymentDayOfMonth));
  }
  setters.setPaymentStatus("do zapłaty");
}

function CostNameSelectField({
  costNames,
  costCategories,
  selectedId,
  customName,
  onSelectId,
  onCustomNameChange,
  portalReady,
  onAddCostName,
}: {
  costNames: CostName[];
  costCategories: BudgetCategory[];
  selectedId: string;
  customName: string;
  onSelectId: (id: string) => void;
  onCustomNameChange: (name: string) => void;
  portalReady: boolean;
  onAddCostName: (costName: CostName) => void;
}) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <>
      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Nazwa kosztu / kontrahent
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => onSelectId(e.target.value)}
            className={`${inputClass} min-w-0 flex-1`}
            required={selectedId !== CUSTOM_COST_NAME_VALUE}
          >
            {costNames.map((cn) => (
              <option key={cn.id} value={cn.id}>
                {cn.name}
              </option>
            ))}
            <option value={CUSTOM_COST_NAME_VALUE}>— inna nazwa —</option>
          </select>
          <button
            type="button"
            title="Dodaj nazwę kosztu"
            onClick={() => setQuickAddOpen(true)}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-medium text-sky-700 shadow-sm hover:border-sky-400 hover:bg-sky-50"
          >
            +
          </button>
        </div>
      </label>
      {selectedId === CUSTOM_COST_NAME_VALUE && (
        <FormField label="Wpisz własną nazwę kosztu">
          <input
            type="text"
            value={customName}
            onChange={(e) => onCustomNameChange(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
      )}
      {quickAddOpen && (
        <QuickAddCostNameModal
          portalReady={portalReady}
          costNames={costNames}
          costCategories={costCategories}
          onClose={() => setQuickAddOpen(false)}
          onAdd={(cn) => {
            onAddCostName(cn);
            onSelectId(cn.id);
          }}
        />
      )}
    </>
  );
}

function AddCostModal({
  portalReady,
  categories,
  allCategories,
  costNames,
  initial,
  onClose,
  onSubmit,
  onAddCategory,
  onAddCostName,
}: {
  portalReady: boolean;
  categories: BudgetCategory[];
  allCategories: BudgetCategory[];
  costNames: CostName[];
  initial?: CalendarCostPrefill;
  onClose: () => void;
  onSubmit: (entry: BudgetEntry) => void;
  onAddCategory: (category: BudgetCategory) => void;
  onAddCostName: (costName: CostName) => void;
}) {
  const [date, setDate] = useState(
    () => initial?.date ?? getTodayDateInputValue(),
  );
  const [selectedCostNameId, setSelectedCostNameId] = useState(
    costNames[0]?.id ?? CUSTOM_COST_NAME_VALUE,
  );
  const [customCostName, setCustomCostName] = useState("");
  const [name, setName] = useState(costNames[0]?.name ?? "");
  const [category, setCategory] = useState(
    costNames[0]?.defaultCategory ?? categories[0]?.name ?? "",
  );
  const [amount, setAmount] = useState("");
  const [invoiceRef, setInvoiceRef] = useState(() =>
    formatTransferTitle(costNames[0]?.defaultTransferTitle),
  );
  const [dueDate, setDueDate] = useState(
    () => initial?.dueDate ?? getTodayDateInputValue(),
  );
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("do zapłaty");
  const [cyclic, setCyclic] = useState(costNames[0]?.cyclic ?? false);
  const [cyclicFrequency, setCyclicFrequency] =
    useState<CyclicFrequency>("co miesiąc");

  useEffect(() => {
    if (!portalReady || initial) return;
    const today = getTodayDateInputValue();
    setDate(today);
    setDueDate(today);
  }, [portalReady, initial]);

  useEffect(() => {
    if (!initial) return;
    setDate(initial.date);
    setDueDate(initial.dueDate);
    setPaymentStatus("do zapłaty");
    const cn = findCostNameByName(costNames, initial.rowLabel);
    if (cn) {
      setSelectedCostNameId(cn.id);
      setName(cn.name);
      setCategory(cn.defaultCategory);
      setInvoiceRef(formatTransferTitle(cn.defaultTransferTitle));
      setCyclic(cn.cyclic);
      setCustomCostName("");
    } else {
      setSelectedCostNameId(CUSTOM_COST_NAME_VALUE);
      setCustomCostName(initial.rowLabel);
      setName(initial.rowLabel);
      setCategory(categories[0]?.name ?? "");
      setInvoiceRef("");
      setCyclic(false);
    }
  }, [initial, costNames, categories]);

  useEffect(() => {
    if (categories.length === 0) {
      setCategory("");
      return;
    }
    if (!categories.some((c) => c.name === category)) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  const handleCostNameSelect = (id: string) => {
    setSelectedCostNameId(id);
    if (id === CUSTOM_COST_NAME_VALUE) {
      setName(customCostName);
      return;
    }
    const cn = findCostNameById(costNames, id);
    if (!cn) return;
    applyCostNameDefaults(cn, {
      setName,
      setCategory,
      setInvoiceRef,
      setCyclic,
      setDueDate,
      setPaymentStatus,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    const resolvedName =
      selectedCostNameId === CUSTOM_COST_NAME_VALUE
        ? customCostName.trim() || name.trim()
        : name.trim();
    let selectedCn =
      selectedCostNameId !== CUSTOM_COST_NAME_VALUE
        ? findCostNameById(costNames, selectedCostNameId)
        : undefined;
    if (!resolvedName || !category || Number.isNaN(parsed) || parsed <= 0) {
      return;
    }
    if (selectedCostNameId === CUSTOM_COST_NAME_VALUE) {
      const existing = findCostNameByName(costNames, resolvedName);
      if (existing) {
        selectedCn = existing;
      } else {
        const dueDayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
        const paymentDay = dueDayMatch ? Number(dueDayMatch[3]) : undefined;
        const created: CostName = {
          id: createCostNameId(),
          name: resolvedName,
          defaultCategory: category,
          defaultTransferTitle: invoiceRef.trim() || undefined,
          cyclic,
          defaultPaymentDayOfMonth:
            cyclic &&
            paymentDay != null &&
            paymentDay >= 1 &&
            paymentDay <= 31
              ? paymentDay
              : undefined,
        };
        onAddCostName(created);
        selectedCn = created;
      }
    }
    onSubmit({
      id: createEntryId(),
      date,
      name: resolvedName,
      costName: selectedCn?.name ?? resolvedName,
      costNameId: selectedCn?.id,
      category,
      type: "koszt",
      amount: parsed,
      cyclic,
      cyclicStatus: cyclic ? "wymaga potwierdzenia" : undefined,
      cyclicFrequency: cyclic ? cyclicFrequency : undefined,
      paymentStatus,
      invoiceRef: invoiceRef.trim(),
      dueDate: dueDate || date,
    });
  };

  return (
    <ModalShell
      title="Dodaj koszt"
      onClose={onClose}
      portalReady={portalReady}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              const next = e.target.value;
              setDate(next);
              setDueDate((prev) => (prev === date ? next : prev));
            }}
            className={inputClass}
            required
          />
        </FormField>
        <CostNameSelectField
          costNames={costNames}
          costCategories={categories}
          selectedId={selectedCostNameId}
          customName={customCostName}
          onSelectId={handleCostNameSelect}
          onCustomNameChange={(value) => {
            setCustomCostName(value);
            setName(value);
          }}
          portalReady={portalReady}
          onAddCostName={onAddCostName}
        />
        <CategorySelectField
          label="Kategoria"
          categories={categories}
          allCategories={allCategories}
          value={category}
          onChange={setCategory}
          formType="koszt"
          emptyMessage="Brak kategorii kosztów — dodaj kategorię typu koszt."
          portalReady={portalReady}
          onAddCategory={onAddCategory}
        />
        <FormField label="Kwota (zł)">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <FormField label="Numer faktury / tytuł przelewu">
          <input
            type="text"
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
            placeholder="np. FV/06/2026/123 albo ZUS 06/2026"
            className={inputClass}
          />
        </FormField>
        <FormField label="Termin płatności">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Status płatności">
          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as PaymentStatus)
            }
            className={inputClass}
          >
            {ALL_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={cyclic}
            onChange={(e) => setCyclic(e.target.checked)}
            className="rounded border-slate-300 text-sky-600 focus:ring-sky-200"
          />
          Płatność cykliczna
        </label>
        {cyclic && (
          <CyclicFrequencyField
            value={cyclicFrequency}
            onChange={setCyclicFrequency}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Zapisz
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AddRevenueModal({
  portalReady,
  categories,
  allCategories,
  incomeSources,
  title,
  initial,
  onClose,
  onSubmit,
  onAddCategory,
  onAddIncomeSource,
}: {
  portalReady: boolean;
  categories: BudgetCategory[];
  allCategories: BudgetCategory[];
  incomeSources: IncomeSource[];
  title: string;
  initial?: CalendarIncomePrefill;
  onClose: () => void;
  onSubmit: (entry: BudgetEntry) => void;
  onAddCategory: (category: BudgetCategory) => void;
  onAddIncomeSource: (source: IncomeSource) => void;
}) {
  const [date, setDate] = useState(
    () => initial?.date ?? getTodayDateInputValue(),
  );
  const [selectedSourceId, setSelectedSourceId] = useState(
    incomeSources[0]?.id ?? CUSTOM_INCOME_SOURCE_VALUE,
  );
  const [customSourceName, setCustomSourceName] = useState("");
  const [name, setName] = useState(incomeSources[0]?.name ?? "");
  const [category, setCategory] = useState(
    incomeSources[0]?.defaultCategory ?? categories[0]?.name ?? "",
  );
  const [amount, setAmount] = useState("");
  const [invoiceRef, setInvoiceRef] = useState(() =>
    formatIncomeDescription(incomeSources[0]?.defaultDescription),
  );
  const operationType: OperationType = "planowany wpływ";

  useEffect(() => {
    if (!portalReady || initial) return;
    setDate(getTodayDateInputValue());
  }, [portalReady, initial]);

  useEffect(() => {
    if (!initial) return;
    setDate(initial.date);
    const source = findIncomeSourceByName(incomeSources, initial.rowLabel);
    if (source) {
      setSelectedSourceId(source.id);
      setName(source.name);
      setCategory(source.defaultCategory);
      setInvoiceRef(formatIncomeDescription(source.defaultDescription));
      setCustomSourceName("");
    } else {
      setSelectedSourceId(CUSTOM_INCOME_SOURCE_VALUE);
      setCustomSourceName(initial.rowLabel);
      setName(initial.rowLabel);
      setCategory(categories[0]?.name ?? "");
      setInvoiceRef("");
    }
  }, [initial, incomeSources, categories]);

  useEffect(() => {
    if (categories.length === 0) {
      setCategory("");
      return;
    }
    if (!categories.some((c) => c.name === category)) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  const handleSourceSelect = (id: string) => {
    setSelectedSourceId(id);
    if (id === CUSTOM_INCOME_SOURCE_VALUE) {
      setName(customSourceName);
      return;
    }
    const source = findIncomeSourceById(incomeSources, id);
    if (!source) return;
    applyIncomeSourceDefaults(source, {
      setName,
      setCategory,
      setInvoiceRef,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    const resolvedName =
      selectedSourceId === CUSTOM_INCOME_SOURCE_VALUE
        ? customSourceName.trim() || name.trim()
        : name.trim();
    let selectedSource =
      selectedSourceId !== CUSTOM_INCOME_SOURCE_VALUE
        ? findIncomeSourceById(incomeSources, selectedSourceId)
        : undefined;
    if (!resolvedName || !category || Number.isNaN(parsed) || parsed <= 0) {
      return;
    }
    if (selectedSourceId === CUSTOM_INCOME_SOURCE_VALUE) {
      const existing = findIncomeSourceByName(incomeSources, resolvedName);
      if (existing) {
        selectedSource = existing;
      } else {
        const created: IncomeSource = {
          id: createIncomeSourceId(),
          name: resolvedName,
          defaultCategory: category,
          defaultType: "planowany wpływ",
          defaultDescription: invoiceRef.trim() || undefined,
        };
        onAddIncomeSource(created);
        selectedSource = created;
      }
    }
    onSubmit({
      id: createEntryId(),
      date,
      name: resolvedName,
      incomeSourceId: selectedSource?.id,
      category,
      type: operationType,
      amount: parsed,
      cyclic: false,
      paymentStatus: "do zapłaty",
      invoiceRef: invoiceRef.trim(),
      dueDate: date,
    });
  };

  return (
    <ModalShell title={title} onClose={onClose} portalReady={portalReady}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <IncomeSourceSelectField
          incomeSources={incomeSources}
          revenueCategories={categories}
          selectedId={selectedSourceId}
          customName={customSourceName}
          onSelectId={handleSourceSelect}
          onCustomNameChange={(value) => {
            setCustomSourceName(value);
            setName(value);
          }}
          portalReady={portalReady}
          onAddIncomeSource={onAddIncomeSource}
        />
        <CategorySelectField
          label="Kategoria"
          categories={categories}
          allCategories={allCategories}
          value={category}
          onChange={setCategory}
          formType="planowany przychód"
          emptyMessage="Brak kategorii planowanych przychodów — dodaj kategorię typu planowany przychód."
          portalReady={portalReady}
          onAddCategory={onAddCategory}
        />
        <FormField label="Kwota (zł)">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <FormField label="Numer dokumentu / opis wpływu">
          <input
            type="text"
            value={invoiceRef}
            onChange={(e) => setInvoiceRef(e.target.value)}
            placeholder="np. Planowany wpływ Allegro 22.06.2026 albo Zwrot środków"
            className={inputClass}
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Zapisz
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

type EditCopyField = "amount" | "title" | "full";

const editCopyButtonClass =
  "shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800";

function EditEntryModal({
  portalReady,
  entry,
  categories,
  allCategories,
  onClose,
  onSubmit,
  onDelete,
  onAddCategory,
}: {
  portalReady: boolean;
  entry: BudgetEntry;
  categories: BudgetCategory[];
  allCategories: BudgetCategory[];
  onClose: () => void;
  onSubmit: (entry: BudgetEntry) => void;
  onDelete: (id: string) => void;
  onAddCategory: (category: BudgetCategory) => void;
}) {
  const [date, setDate] = useState(entry.date);
  const [name, setName] = useState(entry.name);
  const [category, setCategory] = useState(entry.category);
  const [amount, setAmount] = useState(String(entry.amount));
  const [paymentStatus, setPaymentStatus] = useState(entry.paymentStatus);
  const [invoiceRef, setInvoiceRef] = useState(entry.invoiceRef);
  const [dueDate, setDueDate] = useState(entry.dueDate);
  const [paidDate, setPaidDate] = useState(entry.paidDate ?? "");
  const [cyclic, setCyclic] = useState(entry.cyclic);
  const [cyclicFrequency, setCyclicFrequency] = useState<CyclicFrequency>(
    entry.cyclicFrequency ?? "co miesiąc",
  );
  const [operationType, setOperationType] = useState<OperationType>(
    entry.type === "wpływ do akceptacji" ? "planowany wpływ" : entry.type,
  );
  const [copiedField, setCopiedField] = useState<EditCopyField | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const isCost = operationType === "koszt";

  const showCopyFeedback = (field: EditCopyField) => {
    setCopiedField(field);
    setCopyToast("Skopiowano do schowka");
    window.setTimeout(() => {
      setCopiedField((current) => (current === field ? null : current));
      setCopyToast((current) =>
        current === "Skopiowano do schowka" ? null : current,
      );
    }, 2000);
  };

  const handleCopyAmount = async () => {
    const parsed = parseFloat(amount.replace(",", "."));
    if (Number.isNaN(parsed)) return;
    await copyTextToClipboard(formatAmountForClipboard(parsed));
    showCopyFeedback("amount");
  };

  const handleCopyTitle = async () => {
    const title = invoiceRef.trim();
    if (!title) return;
    await copyTextToClipboard(title);
    showCopyFeedback("title");
  };

  const handleCopyTransferDetails = async () => {
    const parsed = parseFloat(amount.replace(",", "."));
    if (Number.isNaN(parsed) || !name.trim()) return;
    await copyTextToClipboard(
      buildEditModalTransferCopyText({
        name: name.trim(),
        invoiceRef: invoiceRef.trim() || undefined,
        amount: parsed,
        dueDate,
      }),
    );
    showCopyFeedback("full");
  };

  const invoiceRefLabel =
    operationType === "koszt"
      ? "Numer faktury / tytuł przelewu"
      : "Numer dokumentu / opis wpływu";

  const typeCategories = filterCategoriesForEntryType(
    categories,
    operationType,
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!name.trim() || !category || Number.isNaN(parsed) || parsed <= 0) {
      return;
    }
    let updated: BudgetEntry = {
      ...entry,
      date,
      name: name.trim(),
      category,
      type: operationType,
      amount: parsed,
      paymentStatus,
      invoiceRef: invoiceRef.trim(),
      dueDate,
      cyclic: operationType === "koszt" ? cyclic : false,
      cyclicFrequency:
        operationType === "koszt" && cyclic ? cyclicFrequency : undefined,
      cyclicStatus:
        operationType === "koszt" && cyclic
          ? entry.cyclicStatus ?? "wymaga potwierdzenia"
          : undefined,
      paidDate: paidDate || undefined,
    };
    updated = setEntryPaymentStatus(updated, paymentStatus);
    onSubmit(updated);
  };

  const handleDelete = () => {
    if (!window.confirm("Czy na pewno usunąć tę operację?")) return;
    onDelete(entry.id);
  };

  return (
    <ModalShell
      title="Edytuj operację"
      onClose={onClose}
      portalReady={portalReady}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <FormField label="Typ operacji">
          <select
            value={operationType}
            onChange={(e) =>
              setOperationType(e.target.value as OperationType)
            }
            className={inputClass}
          >
            <option value="koszt">koszt</option>
            <option value="planowany wpływ">planowany wpływ</option>
            <option value="rzeczywisty wpływ">rzeczywisty wpływ</option>
          </select>
        </FormField>
        <FormField label="Nazwa">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        <CategorySelectField
          label="Kategoria"
          categories={typeCategories}
          allCategories={allCategories}
          value={category}
          onChange={setCategory}
          formType={
            operationType === "koszt" ? "koszt" : "planowany przychód"
          }
          emptyMessage="Brak kategorii dla tego typu operacji."
          portalReady={portalReady}
          onAddCategory={onAddCategory}
        />
        <FormField label="Kwota (zł)">
          <div className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
              required
            />
            {isCost && (
              <button
                type="button"
                onClick={() => void handleCopyAmount()}
                className={editCopyButtonClass}
                title="Kopiuj kwotę"
              >
                {copiedField === "amount" ? "Skopiowano" : "Kopiuj"}
              </button>
            )}
          </div>
        </FormField>
        <FormField label="Status płatności">
          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as PaymentStatus)
            }
            className={inputClass}
          >
            {ALL_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={invoiceRefLabel}>
          <div className="flex gap-2">
            <input
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
            />
            {isCost && (
              <button
                type="button"
                onClick={() => void handleCopyTitle()}
                disabled={!invoiceRef.trim()}
                className={`${editCopyButtonClass} disabled:cursor-not-allowed disabled:opacity-40`}
                title="Kopiuj tytuł"
              >
                {copiedField === "title" ? "Skopiowano" : "Kopiuj"}
              </button>
            )}
          </div>
        </FormField>
        {isCost && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => void handleCopyTransferDetails()}
              className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-100"
            >
              {copiedField === "full"
                ? "Skopiowano"
                : "Kopiuj dane do przelewu"}
            </button>
            {copyToast && (
              <p className="text-center text-xs text-emerald-700">{copyToast}</p>
            )}
          </div>
        )}
        <FormField label="Termin płatności">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
            required
          />
        </FormField>
        {entry.originalDueDate && (
          <p className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-sm text-rose-900">
            Pierwotny termin płatności:{" "}
            {formatDisplayDate(entry.originalDueDate)}
          </p>
        )}
        <FormField label="Data zapłaty">
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
        {operationType === "koszt" && (
          <>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={cyclic}
                onChange={(e) => setCyclic(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-200"
              />
              Płatność cykliczna
            </label>
            {cyclic && (
              <CyclicFrequencyField
                value={cyclicFrequency}
                onChange={setCyclicFrequency}
              />
            )}
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            Usuń operację
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Zapisz
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

