import type { BudgetEntry } from "@/data/budget-mock";
import type {
  ImportStatus,
  PendingInflow,
  RejectedInflow,
} from "@/data/pending-inflows-mock";
import { createPendingInflowId } from "@/lib/budget-utils";

type InflowLike = {
  date: string;
  amount: number;
  name: string;
  source: string;
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function inflowFingerprint(item: InflowLike): string {
  return [
    item.date,
    String(normalizeAmount(item.amount)),
    normalizeText(item.name),
    normalizeText(item.source),
  ].join("|");
}

function extractSourceFromEntry(entry: BudgetEntry): string {
  const ref = entry.invoiceRef?.trim() ?? "";
  const separator = " — ";
  const idx = ref.indexOf(separator);
  if (idx > 0) return ref.slice(0, idx).trim();
  return "";
}

function entryToInflowLike(entry: BudgetEntry): InflowLike | null {
  if (
    entry.type !== "rzeczywisty wpływ" &&
    entry.type !== "wpływ do akceptacji"
  ) {
    return null;
  }
  return {
    date: entry.date,
    amount: entry.amount,
    name: entry.name,
    source: extractSourceFromEntry(entry),
  };
}

function collectKnownFingerprints(
  pending: PendingInflow[],
  entries: BudgetEntry[],
  rejected: RejectedInflow[],
): Set<string> {
  const fingerprints = new Set<string>();
  for (const item of [...pending, ...rejected]) {
    fingerprints.add(inflowFingerprint(item));
  }
  for (const entry of entries) {
    const like = entryToInflowLike(entry);
    if (like) fingerprints.add(inflowFingerprint(like));
  }
  return fingerprints;
}

function resolveImportStatus(
  item: InflowLike,
  knownFingerprints: Set<string>,
): ImportStatus {
  return knownFingerprints.has(inflowFingerprint(item))
    ? "prawdopodobny duplikat"
    : "nowy";
}

/** Przygotowuje wpływy z importu: nadaje id, ustawia status importu (nowy / duplikat). */
export function prepareImportedPendingInflows(
  templates: Omit<PendingInflow, "id">[],
  existingPending: PendingInflow[],
  entries: BudgetEntry[],
  rejected: RejectedInflow[],
): PendingInflow[] {
  const knownFingerprints = collectKnownFingerprints(
    existingPending,
    entries,
    rejected,
  );
  const prepared: PendingInflow[] = [];

  for (const template of templates) {
    const candidate: InflowLike = {
      date: template.date,
      amount: template.amount,
      name: template.name,
      source: template.source,
    };
    const importStatus = resolveImportStatus(candidate, knownFingerprints);
    const item: PendingInflow = {
      ...template,
      id: createPendingInflowId(),
      importStatus,
    };
    prepared.push(item);
    knownFingerprints.add(inflowFingerprint(candidate));
  }

  return prepared;
}

export type MergeImportedPendingResult = {
  merged: PendingInflow[];
  addedCount: number;
};

/** Scala przygotowane wpływy z listą oczekujących bez powielania id lub fingerprintu. */
export function mergeImportedPendingInflows(
  existing: PendingInflow[],
  incoming: PendingInflow[],
): MergeImportedPendingResult {
  const existingIds = new Set(existing.map((p) => p.id));
  const existingFingerprints = new Set(
    existing.map((p) => inflowFingerprint(p)),
  );
  const merged = [...existing];
  let addedCount = 0;

  for (const item of incoming) {
    if (existingIds.has(item.id)) continue;
    const fingerprint = inflowFingerprint(item);
    if (existingFingerprints.has(fingerprint)) continue;
    merged.push(item);
    existingIds.add(item.id);
    existingFingerprints.add(fingerprint);
    addedCount++;
  }

  return { merged, addedCount };
}
