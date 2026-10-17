import { format } from 'date-fns';

// Parses free-form notes such as:
//   1650+1650 - 2nd(2pm) - 14/oct
//   1700 ot drop 8pm - 14/oct/26
//   764 paid for cng - santhu paid
//   1k paid to vijay (12/oct) - santhu paid.

export type ParsedRow =
  | { kind: 'trip'; date: string; slot: string; amount: number; source: string }
  | { kind: 'expense'; date: string; category: string; amount: number; paidBy: string; notes: string; source: string };

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "-" only counts as a date separator without spaces, so "1650 - 2nd" is not a date
const DATE_RE = /\b(\d{1,2})(?:\s*[/.]\s*|-)([a-z]{3,9}|\d{1,2})(?:(?:\s*[/.]\s*|-)(\d{2,4}))?\b/i;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toAmount = (s: string) => {
  const m = s.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)(k)?$/);
  if (!m) return NaN;
  return parseFloat(m[1]) * (m[2] ? 1000 : 1);
};

function parseDate(text: string, fallbackYear: number): { date: string | null; rest: string } {
  const m = text.match(DATE_RE);
  if (!m) return { date: null, rest: text };
  const day = parseInt(m[1], 10);
  const monthIdx = /^\d+$/.test(m[2]) ? parseInt(m[2], 10) - 1 : MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
  if (monthIdx < 0 || monthIdx > 11 || day < 1 || day > 31) return { date: null, rest: text };
  let year = m[3] ? parseInt(m[3], 10) : fallbackYear;
  if (year < 100) year += 2000;
  const d = new Date(year, monthIdx, day);
  return { date: format(d, 'yyyy-MM-dd'), rest: text.replace(m[0], ' ') };
}

export function normalizeSlot(text: string): string {
  const t = text.toLowerCase();
  if (/\bot\b|drop|8\s*pm/.test(t)) return 'OT drop (8pm)';
  if (/2nd|second|2\s*pm/.test(t)) return '2nd shift (2pm)';
  const cleaned = text.replace(/[-–]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || 'Trip';
}

function guessCategory(t: string, driverName?: string | null): string {
  if (/\bcng\b|\bgas\b/.test(t)) return 'cng';
  if (/petrol|diesel|fuel/.test(t)) return 'petrol';
  if (/\bemi\b|loan/.test(t)) return 'emi';
  if (/driver|salary|bata/.test(t) || (driverName && t.includes(driverName.toLowerCase()))) return 'driver';
  if (/service|repair|tyre|tire|oil|wash/.test(t)) return 'maintenance';
  if (/toll|parking|fastag/.test(t)) return 'toll';
  if (/paid to\s+[a-z]/.test(t)) return 'driver';
  return 'other';
}

function guessPayer(t: string, partners: string[]): string {
  // Prefer "<name> paid"; fall back to any partner mentioned; else first partner
  for (const p of partners) {
    if (new RegExp(`\\b${escapeRe(p.toLowerCase())}\\s*paid`).test(t)) return p;
  }
  for (const p of partners) {
    if (t.includes(p.toLowerCase())) return p;
  }
  return partners[0] ?? '';
}

export function parseCarNotes(
  text: string,
  opts: { partners: string[]; driverName?: string | null; defaultDate: string },
): { rows: ParsedRow[]; skipped: string[] } {
  const fallbackYear = parseInt(opts.defaultDate.slice(0, 4), 10);
  const rows: ParsedRow[] = [];
  const skipped: string[] = [];
  let lastDate = opts.defaultDate;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const lower = line.toLowerCase();

    if (/\bpaid\b|\bspent\b|\bgave\b/.test(lower)) {
      const amt = toAmount((lower.match(/^\s*(\d+(?:\.\d+)?k?)/) || [])[1] || '');
      if (!amt) { skipped.push(line); continue; }
      const { date } = parseDate(line, fallbackYear);
      rows.push({
        kind: 'expense',
        date: date ?? opts.defaultDate,
        category: guessCategory(lower, opts.driverName),
        amount: amt,
        paidBy: guessPayer(lower, opts.partners),
        notes: line,
        source: line,
      });
      continue;
    }

    const lead = line.match(/^\s*(\d+(?:\.\d+)?k?(?:\s*\+\s*\d+(?:\.\d+)?k?)*)/i);
    if (!lead) { skipped.push(line); continue; }
    const amounts = lead[1].split('+').map(toAmount).filter(n => !isNaN(n) && n > 0);
    if (!amounts.length) { skipped.push(line); continue; }
    const { date, rest } = parseDate(line.slice(lead[0].length), fallbackYear);
    if (date) lastDate = date;
    const slot = normalizeSlot(rest);
    amounts.forEach(amount => rows.push({ kind: 'trip', date: date ?? lastDate, slot, amount, source: line }));
  }

  return { rows, skipped };
}
