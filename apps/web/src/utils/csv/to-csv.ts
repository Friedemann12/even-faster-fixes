function toCellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function toCsvCell(value: unknown) {
  const text = toCellText(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// Replaces xlsx, which was only used to write CSV and carried unpatched advisories on npm.
export function toCsv(rows: Array<Record<string, unknown>>) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [headers, ...rows.map((row) => headers.map((h) => row[h]))]
    .map((line) => line.map(toCsvCell).join(","))
    .join("\r\n");
}
