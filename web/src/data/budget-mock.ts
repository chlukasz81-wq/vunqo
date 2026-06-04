export type OperationType =
  | "koszt"
  | "planowany wpływ"
  | "wpływ do akceptacji"
  | "rzeczywisty wpływ";

/** @deprecated Użyj OperationType */
export type EntryType = OperationType;

export type CyclicStatus =
  | "kwota potwierdzona"
  | "wymaga potwierdzenia"
  | "zmieniona kwota";

export type PaymentStatus =
  | "do zapłaty"
  | "zapłacone"
  | "po terminie"
  | "przesunięte"
  | "wymaga potwierdzenia"
  | "cykliczna potwierdzona";

export type CyclicFrequency =
  | "co miesiąc"
  | "co tydzień"
  | "co rok"
  | "własna";

export const CYCLIC_FREQUENCY_OPTIONS: CyclicFrequency[] = [
  "co miesiąc",
  "co tydzień",
  "co rok",
  "własna",
];

export type CategoryType = "koszt" | "planowany przychód" | "oba";

export interface BudgetCategory {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
}

export interface BudgetEntry {
  id: string;
  date: string;
  name: string;
  /** Nazwa kosztu / kontrahent (dla type koszt). */
  costName?: string;
  costNameId?: string;
  /** Id źródła wpływu (planowany / rzeczywisty wpływ). */
  incomeSourceId?: string;
  category: string;
  type: OperationType;
  amount: number;
  cyclic: boolean;
  cyclicStatus?: CyclicStatus;
  cyclicFrequency?: CyclicFrequency;
  paymentStatus: PaymentStatus;
  invoiceRef: string;
  dueDate: string;
  paidDate?: string;
  /** Termin przed przeniesieniem na dziś (przesunięte płatności). */
  originalDueDate?: string;
}

/** Stała data odniesienia dla mocków (czerwiec 2026). */
export const REFERENCE_DATE = new Date(2026, 5, 22);

export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: "cat-zus", name: "ZUS i podatki", type: "koszt", color: "rose" },
  { id: "cat-allegro-k", name: "Allegro", type: "koszt", color: "amber" },
  { id: "cat-reklamy", name: "Reklamy", type: "koszt", color: "violet" },
  { id: "cat-towar", name: "Towar", type: "koszt", color: "sky" },
  { id: "cat-leasing", name: "Leasing / auto", type: "koszt", color: "slate" },
  { id: "cat-ksiegowosc", name: "Księgowość", type: "koszt", color: "emerald" },
  { id: "cat-abonamenty", name: "Abonamenty", type: "koszt", color: "sky" },
  {
    id: "cat-serwery",
    name: "Serwery i domeny",
    type: "koszt",
    color: "violet",
  },
  { id: "cat-narzedzia", name: "Narzędzia", type: "koszt", color: "sky" },
  { id: "cat-inne-k", name: "Inne", type: "koszt", color: "slate" },
  {
    id: "cat-sprzedaz-allegro",
    name: "Sprzedaż Allegro",
    type: "planowany przychód",
    color: "amber",
  },
  {
    id: "cat-sprzedaz-sklep",
    name: "Sprzedaż sklep",
    type: "planowany przychód",
    color: "emerald",
  },
  {
    id: "cat-hurtownia",
    name: "Hurtownia",
    type: "planowany przychód",
    color: "sky",
  },
  {
    id: "cat-zwroty",
    name: "Zwroty",
    type: "planowany przychód",
    color: "rose",
  },
  {
    id: "cat-wplata-wlasna",
    name: "Wpłata własna",
    type: "planowany przychód",
    color: "violet",
  },
  {
    id: "cat-inne-p",
    name: "Inne wpływy",
    type: "planowany przychód",
    color: "slate",
  },
];

/** Domyślna lista kategorii (alias dla kompatybilności). */
export const MOCK_CATEGORIES: BudgetCategory[] = DEFAULT_CATEGORIES;

export const MOCK_ENTRIES: BudgetEntry[] = [];
