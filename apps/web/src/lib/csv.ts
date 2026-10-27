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
