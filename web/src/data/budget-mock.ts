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

export const MOCK_ENTRIES: BudgetEntry[] = [
  {
    id: "c1",
    date: "2026-06-01",
    name: "Abonament Cursor",
    category: "Abonamenty",
    type: "koszt",
    amount: 80,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "zapłacone",
    invoiceRef: "Cursor Pro 05/2026",
    dueDate: "2026-06-01",
    paidDate: "2026-06-01",
  },
  {
    id: "c2",
    date: "2026-06-05",
    name: "Leasing auta",
    category: "Leasing / auto",
    type: "koszt",
    amount: 2800,
    cyclic: true,
    cyclicStatus: "wymaga potwierdzenia",
    paymentStatus: "wymaga potwierdzenia",
    invoiceRef: "Leasing 05/2026",
    dueDate: "2026-06-05",
  },
  {
    id: "c3",
    date: "2026-06-10",
    name: "Księgowość",
    category: "Księgowość",
    type: "koszt",
    amount: 800,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "zapłacone",
    invoiceRef: "Księgowość 05/2026",
    dueDate: "2026-06-10",
    paidDate: "2026-06-09",
  },
  {
    id: "c4",
    date: "2026-06-12",
    name: "Reklama Allegro",
    category: "Reklamy",
    type: "koszt",
    amount: 450,
    cyclic: false,
    paymentStatus: "po terminie",
    invoiceRef: "Allegro Ads 05/2026",
    dueDate: "2026-06-12",
  },
  {
    id: "c5",
    date: "2026-06-15",
    name: "ZUS",
    category: "ZUS i podatki",
    type: "koszt",
    amount: 1500,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "cykliczna potwierdzona",
    invoiceRef: "ZUS 05/2026",
    dueDate: "2026-06-15",
  },
  {
    id: "c6",
    date: "2026-06-15",
    name: "Księgowość",
    category: "Księgowość",
    type: "koszt",
    amount: 800,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "do zapłaty",
    invoiceRef: "Księgowość 06/2026",
    dueDate: "2026-06-15",
  },
  {
    id: "c7",
    date: "2026-06-15",
    name: "Reklama Allegro",
    category: "Reklamy",
    type: "koszt",
    amount: 450,
    cyclic: false,
    paymentStatus: "do zapłaty",
    invoiceRef: "Allegro Ads 06/2026",
    dueDate: "2026-06-15",
  },
  {
    id: "c8",
    date: "2026-06-15",
    name: "Faktura za towar",
    category: "Towar",
    type: "koszt",
    amount: 1000,
    cyclic: false,
    paymentStatus: "wymaga potwierdzenia",
    invoiceRef: "FV/05/2026/123 — Faktura za towar",
    dueDate: "2026-06-15",
  },
  {
    id: "c9",
    date: "2026-06-20",
    name: "Leasing auta",
    category: "Leasing / auto",
    type: "koszt",
    amount: 2800,
    cyclic: true,
    cyclicStatus: "wymaga potwierdzenia",
    paymentStatus: "do zapłaty",
    invoiceRef: "Leasing 06/2026",
    dueDate: "2026-06-20",
  },
  {
    id: "c10",
    date: "2026-06-20",
    name: "Faktura za towar",
    category: "Towar",
    type: "koszt",
    amount: 2000,
    cyclic: false,
    paymentStatus: "do zapłaty",
    invoiceRef: "FV/06/2026/041 — Faktura za towar",
    dueDate: "2026-06-20",
  },
  {
    id: "c11",
    date: "2026-06-22",
    name: "Reklama Allegro",
    category: "Reklamy",
    type: "koszt",
    amount: 320,
    cyclic: false,
    paymentStatus: "do zapłaty",
    invoiceRef: "Allegro Ads 06/2026",
    dueDate: "2026-06-22",
  },
  {
    id: "c12",
    date: "2026-06-28",
    name: "Serwer OVH",
    category: "Serwery i domeny",
    type: "koszt",
    amount: 120,
    cyclic: true,
    cyclicStatus: "zmieniona kwota",
    paymentStatus: "przesunięte",
    invoiceRef: "OVH VPS 06/2026",
    dueDate: "2026-06-28",
  },
  {
    id: "c13",
    date: "2026-06-30",
    name: "ZUS",
    category: "ZUS i podatki",
    type: "koszt",
    amount: 1500,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "do zapłaty",
    invoiceRef: "ZUS 06/2026",
    dueDate: "2026-06-30",
  },
  {
    id: "r1",
    date: "2026-06-03",
    name: "Planowany wpływ Allegro",
    category: "Sprzedaż Allegro",
    type: "rzeczywisty wpływ",
    amount: 4200,
    cyclic: false,
    paymentStatus: "zapłacone",
    invoiceRef: "Allegro — wpływ 03.06.2026",
    dueDate: "2026-06-03",
    paidDate: "2026-06-03",
  },
  {
    id: "r2",
    date: "2026-06-08",
    name: "Planowany wpływ ze sklepu",
    category: "Sprzedaż sklep",
    type: "rzeczywisty wpływ",
    amount: 3100,
    cyclic: false,
    paymentStatus: "zapłacone",
    invoiceRef: "Sklep — wpływ 08.06.2026",
    dueDate: "2026-06-08",
    paidDate: "2026-06-08",
  },
  {
    id: "r3",
    date: "2026-06-15",
    name: "Planowany wpływ Allegro",
    category: "Sprzedaż Allegro",
    type: "planowany wpływ",
    amount: 1500,
    cyclic: false,
    paymentStatus: "wymaga potwierdzenia",
    invoiceRef: "Allegro — wpływ 15.06.2026",
    dueDate: "2026-06-15",
  },
  {
    id: "r4",
    date: "2026-06-15",
    name: "Planowany wpływ ze sklepu",
    category: "Sprzedaż sklep",
    type: "planowany wpływ",
    amount: 1000,
    cyclic: false,
    paymentStatus: "wymaga potwierdzenia",
    invoiceRef: "Sklep — wpływ 15.06.2026",
    dueDate: "2026-06-15",
  },
  {
    id: "r5",
    date: "2026-06-18",
    name: "Planowany wpływ Allegro",
    category: "Sprzedaż Allegro",
    type: "planowany wpływ",
    amount: 5800,
    cyclic: false,
    paymentStatus: "do zapłaty",
    invoiceRef: "Allegro — wpływ 18.06.2026",
    dueDate: "2026-06-18",
  },
  {
    id: "r6",
    date: "2026-06-20",
    name: "Planowany wpływ ze sklepu",
    category: "Sprzedaż sklep",
    type: "planowany wpływ",
    amount: 1200,
    cyclic: false,
    paymentStatus: "do zapłaty",
    invoiceRef: "Sklep — wpływ 20.06.2026",
    dueDate: "2026-06-20",
  },
  {
    id: "r7",
    date: "2026-06-22",
    name: "Planowany wpływ Allegro",
    category: "Sprzedaż Allegro",
    type: "planowany wpływ",
    amount: 2650,
    cyclic: false,
    paymentStatus: "do zapłaty",
    invoiceRef: "Allegro — wpływ 22.06.2026",
    dueDate: "2026-06-22",
  },
  {
    id: "r8",
    date: "2026-06-25",
    name: "Zwrot środków",
    category: "Zwroty",
    type: "planowany wpływ",
    amount: 380,
    cyclic: false,
    paymentStatus: "przesunięte",
    invoiceRef: "Zwrot — klient 25.06.2026",
    dueDate: "2026-06-25",
  },
  {
    id: "r9",
    date: "2026-05-28",
    name: "Planowany wpływ ze sklepu",
    category: "Sprzedaż sklep",
    type: "rzeczywisty wpływ",
    amount: 2400,
    cyclic: false,
    paymentStatus: "zapłacone",
    invoiceRef: "Sklep — wpływ 28.05.2026",
    dueDate: "2026-05-28",
    paidDate: "2026-05-28",
  },
  {
    id: "c14",
    date: "2026-05-30",
    name: "Serwer OVH",
    category: "Serwery i domeny",
    type: "koszt",
    amount: 99,
    cyclic: true,
    cyclicStatus: "zmieniona kwota",
    paymentStatus: "zapłacone",
    invoiceRef: "OVH VPS 05/2026",
    dueDate: "2026-05-30",
    paidDate: "2026-05-30",
  },
  {
    id: "overdue-zus",
    date: "2026-05-14",
    name: "ZUS",
    costName: "ZUS",
    category: "ZUS i podatki",
    type: "koszt",
    amount: 1500,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "do zapłaty",
    invoiceRef: "ZUS 05/2026",
    dueDate: "2026-05-14",
  },
  {
    id: "overdue-us-pit",
    date: "2026-05-20",
    name: "Urząd Skarbowy",
    costName: "Urząd Skarbowy",
    category: "ZUS i podatki",
    type: "koszt",
    amount: 2500,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "do zapłaty",
    invoiceRef: "PIT5L 05/2026",
    dueDate: "2026-05-20",
  },
  {
    id: "overdue-us-vat",
    date: "2026-05-25",
    name: "Urząd Skarbowy",
    costName: "Urząd Skarbowy",
    category: "ZUS i podatki",
    type: "koszt",
    amount: 1500,
    cyclic: true,
    cyclicStatus: "kwota potwierdzona",
    paymentStatus: "do zapłaty",
    invoiceRef: "VAT 05/2026",
    dueDate: "2026-05-25",
  },
  {
    id: "overdue-ovh",
    date: "2026-05-22",
    name: "Serwer OVH",
    costName: "Serwer OVH",
    category: "Serwery i domeny",
    type: "koszt",
    amount: 99,
    cyclic: true,
    cyclicStatus: "wymaga potwierdzenia",
    paymentStatus: "do zapłaty",
    invoiceRef: "OVH VPS 05/2026",
    dueDate: "2026-05-22",
  },
];
