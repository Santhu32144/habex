import { format } from 'date-fns';
import type { CarTrip, CarExpense } from '@/hooks/useCarBusiness';

export const SLOT_PRESETS = ['2nd shift (2pm)', 'OT drop (8pm)'];
// Extra money in a company payment above the trips total
export const BONUS_SLOT = 'Company bonus';

export const EXPENSE_CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: 'cng', label: 'CNG', color: 'bg-emerald-500' },
  { value: 'petrol', label: 'Petrol', color: 'bg-amber-500' },
  { value: 'driver', label: 'Driver', color: 'bg-sky-500' },
  { value: 'emi', label: 'Car EMI', color: 'bg-violet-500' },
  { value: 'maintenance', label: 'Service / Repair', color: 'bg-orange-500' },
  { value: 'toll', label: 'Toll / Parking', color: 'bg-pink-500' },
  { value: 'other', label: 'Other', color: 'bg-slate-500' },
  // Created by a company payment that is less than the trips total
  { value: 'deduction', label: 'Company deduction', color: 'bg-red-500' },
  { value: 'transfer', label: 'Partner transfer', color: 'bg-cyan-500' },
];

export const FUEL_CATEGORIES = ['cng', 'petrol'];

export const categoryLabel = (value: string) => EXPENSE_CATEGORIES.find(c => c.value === value)?.label ?? value;
export const categoryColor = (value: string) => EXPENSE_CATEGORIES.find(c => c.value === value)?.color ?? 'bg-slate-500';

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n));

// Short form for tight spaces: ₹950, ₹1.65k, ₹14.9k, ₹1.25L
export const inrCompact = (n: number) => {
  const r = Math.round(n);
  const fmt = (v: number, unit: string, digits: number) => `₹${parseFloat(v.toFixed(digits))}${unit}`;
  if (Math.abs(r) >= 100000) return fmt(r / 100000, 'L', 2);
  if (Math.abs(r) >= 10000) return fmt(r / 1000, 'k', 1);
  if (Math.abs(r) >= 1000) return fmt(r / 1000, 'k', 2);
  return `₹${r}`;
};

export const monthKey = (date: string) => date.slice(0, 7); // yyyy-MM
export const monthLabel = (key: string) => format(new Date(`${key}-01T00:00:00`), 'MMM yyyy');

export interface Totals {
  earned: number;          // value of all trips done, paid or not
  received: number;        // paid by the company so far
  pending: number;         // still due from the company
  tripCount: number;
  days: number;            // working days
  fuel: number;
  driver: number;
  emi: number;
  other: number;
  spent: number;           // all real expenses (excludes transfers)
  profit: number;          // earned - spent
}

export function computeTotals(trips: CarTrip[], expenses: CarExpense[]): Totals {
  const t: Totals = { earned: 0, received: 0, pending: 0, tripCount: 0, days: 0, fuel: 0, driver: 0, emi: 0, other: 0, spent: 0, profit: 0 };
  const days = new Set<string>();
  trips.forEach(tr => {
    const amt = Number(tr.amount);
    t.earned += amt;
    if (tr.status === 'received') t.received += amt;
    else t.pending += amt;
    if (tr.slot !== BONUS_SLOT) {
      t.tripCount++;
      days.add(tr.trip_date);
    }
  });
  t.days = days.size;
  expenses.forEach(e => {
    const amt = Number(e.amount);
    if (e.category === 'transfer') return;
    if (FUEL_CATEGORIES.includes(e.category)) t.fuel += amt;
    else if (e.category === 'driver') t.driver += amt;
    else if (e.category === 'emi') t.emi += amt;
    else t.other += amt;
    t.spent += amt;
  });
  t.profit = t.earned - t.spent;
  return t;
}

export interface DayStat {
  trips: number;
  earned: number;
  spent: number;
}

/** Per-day trips, earnings and spend, keyed by yyyy-MM-dd. */
export function computeDayStats(trips: CarTrip[], expenses: CarExpense[]): Record<string, DayStat> {
  const out: Record<string, DayStat> = {};
  const get = (date: string) => {
    if (!out[date]) out[date] = { trips: 0, earned: 0, spent: 0 };
    return out[date];
  };
  trips.forEach(t => {
    const s = get(t.trip_date);
    s.earned += Number(t.amount);
    if (t.slot !== BONUS_SLOT) s.trips++;
  });
  expenses.forEach(e => {
    if (e.category !== 'transfer') get(e.expense_date).spent += Number(e.amount);
  });
  return out;
}

export interface PartnerPosition {
  name: string;
  paid: number;        // money put in (expenses + transfers given)
  received: number;    // money taken (trip payments + transfers received)
  share: number;       // fair share of profit
  settle: number;      // > 0: others owe them; < 0: they owe others
}

/**
 * Only money the company has actually paid is split; unpaid trips wait until
 * the payment is recorded. Profit is split equally. Each partner's position is
 * what they have in hand (received - paid); settle is the gap between that and
 * their fair share.
 */
export function computeSettlement(partners: string[], trips: CarTrip[], expenses: CarExpense[]): PartnerPosition[] {
  if (!partners.length) return [];
  const norm = (s: string | null | undefined) => (s || '').trim().toLowerCase();
  const map = new Map(partners.map(p => [norm(p), { name: p, paid: 0, received: 0, share: 0, settle: 0 }]));
  const get = (name: string | null | undefined) => map.get(norm(name));

  trips.forEach(tr => {
    if (tr.status !== 'received') return;
    const p = get(tr.received_by) ?? get(partners[0]);
    if (p) p.received += Number(tr.amount);
  });
  expenses.forEach(e => {
    const payer = get(e.paid_by);
    if (payer) payer.paid += Number(e.amount);
    if (e.category === 'transfer') {
      const to = get(e.paid_to);
      if (to) to.received += Number(e.amount);
    }
  });

  const { received, spent } = computeTotals(trips, expenses);
  const share = (received - spent) / partners.length;
  return [...map.values()].map(p => ({ ...p, share, settle: share - (p.received - p.paid) }));
}

/** Pairs who should pay whom to square up. */
export function settlementTransfers(positions: PartnerPosition[]) {
  const creditors = positions.filter(p => p.settle > 0.5).map(p => ({ name: p.name, amt: p.settle }));
  const debtors = positions.filter(p => p.settle < -0.5).map(p => ({ name: p.name, amt: -p.settle }));
  const out: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].amt, creditors[j].amt);
    out.push({ from: debtors[i].name, to: creditors[j].name, amount: amt });
    debtors[i].amt -= amt;
    creditors[j].amt -= amt;
    if (debtors[i].amt < 0.5) i++;
    if (creditors[j].amt < 0.5) j++;
  }
  return out;
}
