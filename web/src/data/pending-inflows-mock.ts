export type ImportStatus =

  | "nowy"

  | "prawdopodobny duplikat"

  | "zaakceptowany"

  | "odzucony";



export interface PendingInflow {

  id: string;

  date: string;

  /** Oryginalny opis z wyciągu bankowego (nie zmieniać na „ładne” nazwy). */

  name: string;

  amount: number;

  source: string;

  /** Kategoria przypisana do akceptacji / edycji. */

  category: string;

  /** Sugerowana kategoria do wyświetlenia (np. z reguł importu). */

  suggestedCategory?: string;

  importStatus?: ImportStatus;

}



export type RejectedInflow = PendingInflow;



export const MOCK_PENDING_INFLOWS: PendingInflow[] = [];



export const STORAGE_PENDING_INFLOWS = "vunqo-pending-inflows";



export const STORAGE_REJECTED_INFLOWS = "vunqo-rejected-inflows";



/** Szablony wykrywanych wpływów przy imporcie wyciągu (uzupełniane z pliku CSV). */

export const MOCK_STATEMENT_IMPORT_INFLOWS: Omit<PendingInflow, "id">[] = [];



export function effectiveImportStatus(

  item: PendingInflow,

): ImportStatus {

  return item.importStatus ?? "nowy";

}



export function suggestedCategoryLabel(item: PendingInflow): string {

  return item.suggestedCategory ?? item.category;

}



/** Pozycje oznaczone jako duplikat nie wchodzą w zbiorcze zaznaczenie / akceptację. */

export function isSelectableForBulk(item: PendingInflow): boolean {

  return effectiveImportStatus(item) !== "prawdopodobny duplikat";

}

