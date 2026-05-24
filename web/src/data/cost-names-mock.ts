/** Nazwa kosztu / kontrahent z domyślną kategorią i szablonem tytułu przelewu. */
export interface CostName {
  id: string;
  name: string;
  defaultCategory: string;
  defaultTransferTitle?: string;
  cyclic: boolean;
  defaultPaymentDayOfMonth?: number;
}

export const STORAGE_COST_NAMES = "vunqo-cost-names";

export const DEFAULT_COST_NAMES: CostName[] = [
  {
    id: "cn-zus",
    name: "ZUS",
    defaultCategory: "ZUS i podatki",
    defaultTransferTitle: "ZUS {month}/{year}",
    cyclic: true,
    defaultPaymentDayOfMonth: 15,
  },
  {
    id: "cn-us",
    name: "Urząd Skarbowy",
    defaultCategory: "ZUS i podatki",
    defaultTransferTitle: "Podatek {month}/{year}",
    cyclic: true,
    defaultPaymentDayOfMonth: 20,
  },
  {
    id: "cn-allegro-ads",
    name: "Allegro",
    defaultCategory: "Reklamy",
    defaultTransferTitle: "Allegro Ads {month}/{year}",
    cyclic: true,
    defaultPaymentDayOfMonth: 15,
  },
  {
    id: "cn-leasing",
    name: "Leasing auta",
    defaultCategory: "Leasing / auto",
    defaultTransferTitle: "Leasing {month}/{year}",
    cyclic: true,
    defaultPaymentDayOfMonth: 20,
  },
  {
    id: "cn-ksiegowosc",
    name: "Księgowość",
    defaultCategory: "Księgowość",
    defaultTransferTitle: "Księgowość {month}/{year}",
    cyclic: true,
    defaultPaymentDayOfMonth: 15,
  },
  {
    id: "cn-ovh",
    name: "Serwer OVH",
    defaultCategory: "Serwery i domeny",
    defaultTransferTitle: "OVH VPS {month}/{year}",
    cyclic: true,
    defaultPaymentDayOfMonth: 28,
  },
  {
    id: "cn-cursor",
    name: "Abonament Cursor",
    defaultCategory: "Abonamenty",
    defaultTransferTitle: "Cursor Pro {month}/{year}",
    cyclic: true,
    defaultPaymentDayOfMonth: 1,
  },
  {
    id: "cn-towar",
    name: "Dostawca towaru",
    defaultCategory: "Towar",
    cyclic: false,
  },
  {
    id: "cn-inne",
    name: "Inne",
    defaultCategory: "Inne",
    cyclic: false,
  },
];
