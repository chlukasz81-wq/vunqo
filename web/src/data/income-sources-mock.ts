export type IncomeSourceDefaultType =
  | "planowany wpływ"
  | "rzeczywisty wpływ"
  | "oba";

export interface IncomeSource {
  id: string;
  name: string;
  defaultCategory: string;
  defaultType: IncomeSourceDefaultType;
  defaultDescription?: string;
}

export const STORAGE_INCOME_SOURCES = "vunqo-income-sources";

export const DEFAULT_INCOME_SOURCES: IncomeSource[] = [
  {
    id: "is-allegro",
    name: "Allegro",
    defaultCategory: "Sprzedaż Allegro",
    defaultType: "oba",
    defaultDescription: "Allegro — wpływ {month}.{year}",
  },
  {
    id: "is-allegro-finance",
    name: "Allegro Finance",
    defaultCategory: "Sprzedaż Allegro",
    defaultType: "rzeczywisty wpływ",
    defaultDescription: "Allegro Finance — wpływ",
  },
  {
    id: "is-payu",
    name: "PayU",
    defaultCategory: "Sprzedaż sklep",
    defaultType: "rzeczywisty wpływ",
    defaultDescription: "PayU — wpływ",
  },
  {
    id: "is-p24",
    name: "Przelewy24",
    defaultCategory: "Sprzedaż sklep",
    defaultType: "rzeczywisty wpływ",
    defaultDescription: "Przelewy24 — wpływ",
  },
  {
    id: "is-sklep",
    name: "Sklep internetowy",
    defaultCategory: "Sprzedaż sklep",
    defaultType: "oba",
    defaultDescription: "Sklep — wpływ {month}.{year}",
  },
  {
    id: "is-hurtownia",
    name: "Hurtownia",
    defaultCategory: "Hurtownia",
    defaultType: "planowany wpływ",
    defaultDescription: "Hurtownia — wpływ",
  },
  {
    id: "is-zwrot",
    name: "Zwrot środków",
    defaultCategory: "Zwroty",
    defaultType: "oba",
    defaultDescription: "Zwrot — {month}.{year}",
  },
  {
    id: "is-wplata",
    name: "Wpłata własna",
    defaultCategory: "Wpłata własna",
    defaultType: "rzeczywisty wpływ",
    defaultDescription: "Wpłata własna",
  },
  {
    id: "is-prywatny",
    name: "Przelew prywatny",
    defaultCategory: "Wpłata własna",
    defaultType: "rzeczywisty wpływ",
  },
  {
    id: "is-inne",
    name: "Inne",
    defaultCategory: "Inne wpływy",
    defaultType: "oba",
  },
];
