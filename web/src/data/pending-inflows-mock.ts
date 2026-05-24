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



/** Dwa wpisy już w kolejce — import wyciągu oznaczy je jako prawdopodobne duplikaty. */

export const MOCK_PENDING_INFLOWS: PendingInflow[] = [

  {

    id: "p2",

    date: "2026-06-22",

    name: "WPŁATA WŁASNA",

    amount: 1000,

    source: "mBank",

    category: "Inne wpływy",

    suggestedCategory: "Inne wpływy",

    importStatus: "nowy",

  },

  {

    id: "p5",

    date: "2026-06-24",

    name: "PRZELEW PRYWATNY JAN KOWALSKI",

    amount: 500,

    source: "mBank",

    category: "Inne wpływy",

    suggestedCategory: "Inne wpływy",

    importStatus: "nowy",

  },

];



export const STORAGE_PENDING_INFLOWS = "vunqo-pending-inflows";



export const STORAGE_REJECTED_INFLOWS = "vunqo-rejected-inflows";



/** Mock wpływów wykrytych przy imporcie wyciągu (czerwiec 2026). */

export const MOCK_STATEMENT_IMPORT_INFLOWS: Omit<PendingInflow, "id">[] = [

  {

    date: "2026-06-22",

    name: "ALLEGRO FINANCE SP. Z O.O. WYPŁATA",

    amount: 3420,

    source: "mBank",

    category: "Sprzedaż Allegro",

    suggestedCategory: "Sprzedaż Allegro",

  },

  {

    date: "2026-06-22",

    name: "WPŁATA WŁASNA",

    amount: 1000,

    source: "mBank",

    category: "Inne wpływy",

    suggestedCategory: "Inne wpływy",

  },

  {

    date: "2026-06-23",

    name: "PAYU S.A. ROZLICZENIE SKLEP",

    amount: 1270,

    source: "mBank",

    category: "Sprzedaż sklep",

    suggestedCategory: "Sprzedaż sklep",

  },

  {

    date: "2026-06-23",

    name: "ZWROT ŚRODKÓW FV/06/2026",

    amount: 300,

    source: "mBank",

    category: "Zwroty",

    suggestedCategory: "Zwroty",

  },

  {

    date: "2026-06-24",

    name: "PRZELEW PRYWATNY JAN KOWALSKI",

    amount: 500,

    source: "mBank",

    category: "Inne wpływy",

    suggestedCategory: "Inne wpływy",

  },

];



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

