import "server-only";

import ExcelJS from "exceljs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_DATA_ROWS = 2000;
const HEADER_SCAN_ROWS = 20;

export type ImportColumn<Key extends string> = {
  key: Key;
  label: string;
  required: boolean;
  aliases: readonly string[];
};

export type ParsedExcelRow<Key extends string> = {
  rowNumber: number;
  values: Record<Key, string>;
};

export type ParsedWorkbook<Key extends string> = {
  sheetName: string;
  rows: ParsedExcelRow<Key>[];
};

export class WorkbookImportError extends Error {
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "WorkbookImportError";
    this.fieldErrors = fieldErrors;
  }
}

export function normalizeExcelHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "object") {
    if ("result" in value) {
      return cellToText(
        (value as { result?: ExcelJS.CellValue }).result ?? null,
      );
    }

    if ("richText" in value) {
      const richText = (value as { richText: Array<{ text: string }> }).richText;
      return richText.map((item) => item.text).join("").trim();
    }

    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
  }

  return String(value).trim();
}

function columnAliasMap<Key extends string>(
  columns: readonly ImportColumn<Key>[],
) {
  const map = new Map<string, Key>();

  for (const column of columns) {
    for (const alias of [column.key, column.label, ...column.aliases]) {
      map.set(normalizeExcelHeader(alias), column.key);
    }
  }

  return map;
}

function headerColumnsForRow<Key extends string>(
  row: ExcelJS.Row,
  columns: readonly ImportColumn<Key>[],
) {
  const aliases = columnAliasMap(columns);
  const indexes = new Map<Key, number>();

  row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const normalized = normalizeExcelHeader(cellToText(cell.value));
    const key = aliases.get(normalized);

    if (key && !indexes.has(key)) {
      indexes.set(key, columnNumber);
    }
  });

  return indexes;
}

function isWorkbookFile(file: File) {
  return file.name.toLowerCase().endsWith(".xlsx");
}

export async function parseExcelWorkbook<Key extends string>(
  file: File,
  columns: readonly ImportColumn<Key>[],
): Promise<ParsedWorkbook<Key>> {
  if (!file.name || file.size === 0) {
    throw new WorkbookImportError("Choose an Excel workbook to import.", {
      file: ["The selected file is empty."],
    });
  }

  if (!isWorkbookFile(file)) {
    throw new WorkbookImportError("Only .xlsx Excel workbooks are supported.", {
      file: ["Choose a file ending in .xlsx."],
    });
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new WorkbookImportError("The Excel workbook is too large.", {
      file: ["The maximum supported workbook size is 5 MB."],
    });
  }

  const workbook = new ExcelJS.Workbook();

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await workbook.xlsx.load(buffer);
  } catch {
    throw new WorkbookImportError(
      "The selected file could not be read as an Excel workbook.",
      {
        file: ["Confirm that the file is a valid .xlsx workbook."],
      },
    );
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new WorkbookImportError("The Excel workbook does not contain a worksheet.");
  }

  const requiredKeys = columns
    .filter((column) => column.required)
    .map((column) => column.key);

  let headerRowNumber: number | null = null;
  let indexes: Map<Key, number> | null = null;

  const scanLimit = Math.min(worksheet.actualRowCount, HEADER_SCAN_ROWS);

  for (let rowNumber = 1; rowNumber <= scanLimit; rowNumber += 1) {
    const candidate = headerColumnsForRow(
      worksheet.getRow(rowNumber),
      columns,
    );

    if (requiredKeys.every((key) => candidate.has(key))) {
      headerRowNumber = rowNumber;
      indexes = candidate;
      break;
    }
  }

  if (headerRowNumber === null || indexes === null) {
    const requiredLabels = columns
      .filter((column) => column.required)
      .map((column) => column.label)
      .join(", ");

    throw new WorkbookImportError("Required Excel columns were not found.", {
      file: [
        `The first worksheet must contain these columns: ${requiredLabels}.`,
      ],
    });
  }

  const rows: ParsedExcelRow<Key>[] = [];

  for (
    let rowNumber = headerRowNumber + 1;
    rowNumber <= worksheet.actualRowCount;
    rowNumber += 1
  ) {
    const worksheetRow = worksheet.getRow(rowNumber);
    const values = {} as Record<Key, string>;

    for (const column of columns) {
      const columnNumber = indexes.get(column.key);
      values[column.key] = columnNumber
        ? cellToText(worksheetRow.getCell(columnNumber).value)
        : "";
    }

    const hasData = Object.values(values).some((value) => value.length > 0);

    if (!hasData) {
      continue;
    }

    rows.push({
      rowNumber,
      values,
    });

    if (rows.length > MAX_DATA_ROWS) {
      throw new WorkbookImportError("The Excel workbook contains too many rows.", {
        file: [
          `A single import supports up to ${MAX_DATA_ROWS.toLocaleString()} data rows.`,
        ],
      });
    }
  }

  if (rows.length === 0) {
    throw new WorkbookImportError("No data rows were found in the Excel workbook.", {
      file: ["Add at least one data row below the header row."],
    });
  }

  return {
    sheetName: worksheet.name,
    rows,
  };
}
