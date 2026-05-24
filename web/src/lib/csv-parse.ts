export type ParsedCsvRow = {
  date: string;
  amount: number;
  name: string;
  source?: string;
};

export type CsvParseResult =
  | { ok: true; rows: ParsedCsvRow[] }
  | { ok: false; error: string };

function detectDelimiter(line: string): string {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type ColumnMap = {
  date?: number;
  amount?: number;
  name?: number;
  source?: number;
};

function mapColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  headers.forEach((raw, index) => {
    const h = normalizeHeader(raw);
    if (
      map.date == null &&
      (h.includes("data") ||
        h.includes("date") ||
        h.includes("booking") ||
        h.includes("ksiegow"))
    ) {
      map.date = index;
      return;
    }
    if (
      map.amount == null &&
      (h.includes("kwota") ||
        h.includes("amount") ||
        h.includes("wartosc") ||
        (h.includes("saldo") && h.includes("obrot")))
    ) {
      map.amount = index;
      return;
    }
    if (
      map.name == null &&
      (h.includes("opis") ||
        h.includes("tytul") ||
        h.includes("title") ||
        h.includes("description") ||
        h.includes("nazwa operacji"))
    ) {
      map.name = index;
      return;
    }
    if (
      map.source == null &&
      (h.includes("nadawca") ||
        h.includes("kontrahent") ||
        h.includes("sender") ||
        h.includes("zleceniodawca") ||
        h.includes("odbiorca"))
    ) {
      map.source = index;
    }
  });

  if (map.date == null && headers.length > 0) map.date = 0;
  if (map.amount == null && headers.length > 1) map.amount = 1;
  if (map.name == null && headers.length > 2) map.name = 2;

  return map;
}

function parseDateCell(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dotted = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(trimmed);
  if (dotted) {
    const day = dotted[1].padStart(2, "0");
    const month = dotted[2].padStart(2, "0");
    return `${dotted[3]}-${month}-${day}`;
  }

  return null;
}

function parseAmountCell(value: string): number | null {
  let normalized = value.trim().replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!normalized) return null;

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  if (lastComma > lastDot) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function defaultCategoryForName(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("ALLEGRO")) return "Sprzedaż Allegro";
  if (upper.includes("PAYU") || upper.includes("SKLEP"))
    return "Sprzedaż sklep";
  if (upper.includes("ZWROT")) return "Zwroty środków";
  return "Inne wpływy";
}

export function parseBankCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { ok: false, error: "Za mało wierszy w pliku." };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);
  const columns = mapColumns(headers);

  if (columns.date == null || columns.amount == null || columns.name == null) {
    return { ok: false, error: "Nie rozpoznano kolumn w pliku." };
  }

  const rows: ParsedCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
    if (cells.every((c) => !c.trim())) continue;

    const date = parseDateCell(cells[columns.date] ?? "");
    const amount = parseAmountCell(cells[columns.amount] ?? "");
    const name = (cells[columns.name] ?? "").trim();
    const source =
      columns.source != null
        ? (cells[columns.source] ?? "").trim() || undefined
        : undefined;

    if (!date || amount == null || !name) continue;

    rows.push({
      date,
      amount,
      name,
      source,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "Brak poprawnych wierszy w pliku." };
  }

  return { ok: true, rows };
}

export function parsedRowsToPendingTemplates(
  rows: ParsedCsvRow[],
  bankAccount: string,
): Omit<
  import("@/data/pending-inflows-mock").PendingInflow,
  "id"
>[] {
  const source = bankAccount.trim() || "mBank";
  return rows.map((row) => {
    const category = defaultCategoryForName(row.name);
    return {
      date: row.date,
      name: row.name,
      amount: row.amount,
      source: row.source?.trim() || source,
      category,
      suggestedCategory: category,
    };
  });
}

export function filterRowsByDateRange(
  rows: ParsedCsvRow[],
  dateFrom: string,
  dateTo: string,
): ParsedCsvRow[] {
  if (!dateFrom || !dateTo) return rows;
  return rows.filter((row) => row.date >= dateFrom && row.date <= dateTo);
}
