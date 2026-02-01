export const parseLooseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return NaN;

  // XLSX with raw:false often returns formatted strings (e.g. "19,666,101.24", "₱1,200.00", "50%")
  const str = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/₱|PHP/gi, '')
    .replace(/%/g, '')
    .replace(/,/g, '');

  // Handle negatives in parentheses: (123.45)
  const normalized = /^\(.*\)$/.test(str) ? `-${str.slice(1, -1)}` : str;

  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
};

export const parseDayNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;

  // Accept values like: "9", "9 (EA)", "09", "31 - promo" -> take leading digits
  const match = s.match(/^(\d{1,2})/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  if (day < 1 || day > 31) return null;
  return day;
};
