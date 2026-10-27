type Cell = string | number | boolean | null | undefined;

// RFC 4180 CSV. Text that a spreadsheet would run as a formula (=, +, -, @)
// gets a leading apostrophe; numbers are written as-is.
function cell(v: Cell) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]) {
  // The BOM makes Excel read the file as UTF-8 (accented locality names, °).
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

// Parses RFC 4180 CSV (quoted fields, "" escapes, CRLF or LF, optional BOM)
// into rows of strings. Undoes toCsv's formula guard on the way back in.
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows
    .filter((r) => r.some((f) => f.trim() !== ""))
    .map((r) => r.map((f) => (/^'[=+\-@\t\r]/.test(f) ? f.slice(1) : f)));
}
