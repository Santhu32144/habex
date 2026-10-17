import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, endOfMonth, startOfWeek, endOfWeek, subDays, subWeeks, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Car as CarIcon, Fuel, Plus, ClipboardPaste, Settings2, Download, Pencil, Trash2,
  CheckCircle2, AlertCircle, Wallet, RotateCcw, CalendarDays, CalendarRange, Calendar as CalendarIcon, TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCarDetails, type CarTrip, type CarExpense, type ExpenseInput } from '@/hooks/useCarBusiness';
import {
  computeTotals, computeSettlement, settlementTransfers, computeDayStats, inr, inrCompact, monthKey, monthLabel,
  categoryLabel, categoryColor, EXPENSE_CATEGORIES, FUEL_CATEGORIES, BONUS_SLOT,
} from '@/lib/carBusiness';
import { TripDialog, ExpenseDialog, PaymentDialog } from '@/components/cars/CarEntryDialogs';
import { CarImportDialog } from '@/components/cars/CarImportDialog';
import { CarFormDialog } from '@/components/cars/CarFormDialog';
import { CarCalendar, DayDetailDialog } from '@/components/cars/CarCalendar';
import { CarProfitSplit } from '@/components/cars/CarProfitSplit';
import { cn } from '@/lib/utils';

const ALL = 'all';
const fmtDay = (d: string) => format(parseISO(d), 'EEE, d MMM yyyy');
const fmtShort = (d: string) => format(parseISO(d), 'd MMM');
const iso = (d: Date) => format(d, 'yyyy-MM-dd');
const monthEnd = (m: string) => iso(endOfMonth(parseISO(`${m}-01`)));

// Categorical slots 1-3 of the validated palette, stepped per theme
const chartConfig = {
  Earned: { label: 'Earned', theme: { light: '#2a78d6', dark: '#3987e5' } },
  Spent: { label: 'Spent', theme: { light: '#eb6834', dark: '#d95926' } },
  Profit: { label: 'Profit', theme: { light: '#1baf7a', dark: '#199e70' } },
} satisfies ChartConfig;

const DeleteButton: React.FC<{ onConfirm: () => void; what: string }> = ({ onConfirm, what }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="w-4 h-4 text-destructive" /></Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {what}?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const CarDashboard: React.FC = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const d = useCarDetails(carId);
  const { car, trips, expenses, loading } = d;

  const [month, setMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [tripDialog, setTripDialog] = useState<{ open: boolean; trip?: CarTrip | null; date?: string }>({ open: false });
  const [expenseDialog, setExpenseDialog] = useState<{ open: boolean; expense?: CarExpense | null; preset?: Partial<ExpenseInput> | null }>({ open: false });
  const [dayDate, setDayDate] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState<string>(ALL);
  const [paymentCutoff, setPaymentCutoff] = useState<string | null>(null);

  const months = useMemo(() => {
    const set = new Set<string>([format(new Date(), 'yyyy-MM')]);
    trips.forEach(t => set.add(monthKey(t.trip_date)));
    expenses.forEach(e => set.add(monthKey(e.expense_date)));
    return [...set].sort().reverse();
  }, [trips, expenses]);

  const mTrips = useMemo(() => trips.filter(t => monthKey(t.trip_date) === month), [trips, month]);
  const mExpenses = useMemo(() => expenses.filter(e => monthKey(e.expense_date) === month), [expenses, month]);
  const totals = useMemo(() => computeTotals(mTrips, mExpenses), [mTrips, mExpenses]);
  const allTotals = useMemo(() => computeTotals(trips, expenses), [trips, expenses]);
  const dayStats = useMemo(() => computeDayStats(trips, expenses), [trips, expenses]);

  // Today, this week and this month, each next to the period before it
  const periods = useMemo(() => {
    const now = new Date();
    const sum = (from: string, to: string) => computeTotals(
      trips.filter(t => t.trip_date >= from && t.trip_date <= to),
      expenses.filter(e => e.expense_date >= from && e.expense_date <= to),
    );
    const today = iso(now);
    const yesterday = iso(subDays(now, 1));
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const week: [string, string] = [iso(weekStart), iso(endOfWeek(now, { weekStartsOn: 1 }))];
    const thisMonth = today.slice(0, 7);
    const lastMonth = format(subMonths(now, 1), 'yyyy-MM');
    return {
      today: sum(today, today),
      yesterday: sum(yesterday, yesterday),
      week: sum(...week),
      weekRange: week,
      lastWeek: sum(iso(subWeeks(weekStart, 1)), iso(subDays(weekStart, 1))),
      month: sum(`${thisMonth}-01`, monthEnd(thisMonth)),
      lastMonth: sum(`${lastMonth}-01`, monthEnd(lastMonth)),
    };
  }, [trips, expenses]);

  const daily = useMemo(() => {
    const map = new Map<string, { date: string; trips: CarTrip[]; expenses: CarExpense[] }>();
    const get = (date: string) => {
      if (!map.has(date)) map.set(date, { date, trips: [], expenses: [] });
      return map.get(date)!;
    };
    mTrips.forEach(t => get(t.trip_date).trips.push(t));
    mExpenses.forEach(e => get(e.expense_date).expenses.push(e));
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date)).map(day => ({ ...day, totals: computeTotals(day.trips, day.expenses) }));
  }, [mTrips, mExpenses]);

  const monthly = useMemo(
    () => months.map(m => ({
      month: m,
      ...computeTotals(trips.filter(t => monthKey(t.trip_date) === m), expenses.filter(e => monthKey(e.expense_date) === m)),
    })).filter(r => r.tripCount || r.spent),
    [months, trips, expenses],
  );

  const settlement = useMemo(() => (car ? computeSettlement(car.partners, trips, expenses) : []), [car, trips, expenses]);
  const transfers = useMemo(() => settlementTransfers(settlement), [settlement]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid gap-4 lg:grid-cols-5"><Skeleton className="h-96 lg:col-span-3" /><Skeleton className="h-96 lg:col-span-2" /></div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Car not found or you don't have access.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/investments')}>Go back</Button>
      </div>
    );
  }

  // Monthly fixed costs for the month shown in the calendar
  const emiPaid = mExpenses.filter(e => e.category === 'emi').reduce((s, e) => s + Number(e.amount), 0);
  const driverPaid = mExpenses.filter(e => e.category === 'driver').reduce((s, e) => s + Number(e.amount), 0);
  const emiDue = Math.max(0, car.monthly_emi - emiPaid);
  const driverDue = Math.max(0, car.driver_salary - driverPaid);
  const presetDate = (day?: number | null) => {
    const last = Number(monthEnd(month).slice(8));
    if (day) return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
    return month === format(new Date(), 'yyyy-MM') ? iso(new Date()) : monthEnd(month);
  };
  // Month profit once EMI and driver salary are fully paid
  const projectedProfit = totals.profit - emiDue - driverDue;

  const lastAmount = trips.find(t => t.slot !== BONUS_SLOT)?.amount;
  const firstTrip = trips.length ? trips[trips.length - 1].trip_date : null;
  const fuelPct = totals.earned > 0 ? Math.round((totals.fuel / totals.earned) * 100) : 0;
  const days = totals.days;

  // Payment covers unpaid trips up to the end of the given month (or the oldest unpaid month), never past today
  const openPayment = (forMonth?: string) => {
    const today = iso(new Date());
    const oldestUnpaid = trips.filter(t => t.status !== 'received').map(t => t.trip_date).sort()[0];
    const end = monthEnd(forMonth ?? monthKey(oldestUnpaid ?? today));
    setPaymentCutoff(end < today ? end : today);
  };

  const showMonth = (m: string) => {
    setMonth(m);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportCsv = () => {
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['Type', 'Date', 'Trip / Category', 'Amount', 'Status', 'Paid / Received by', 'Paid to', 'Notes'],
      ...trips.map(t => ['Trip', t.trip_date, t.slot, t.amount, t.status === 'received' ? 'paid' : 'unpaid', t.received_by, '', t.notes]),
      ...expenses.map(e => ['Expense', e.expense_date, categoryLabel(e.category), e.amount, '', e.paid_by, e.paid_to, e.notes]),
      [],
      ['Total earned', allTotals.earned], ['Paid by company', allTotals.received], ['Due from company', allTotals.pending],
      ['Total spent', allTotals.spent], ['Profit', allTotals.profit],
    ].map(r => r.map(q).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([lines], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${car.name}-${iso(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const tiles = [
    {
      label: 'Today', icon: CalendarDays, value: periods.today.earned,
      detail: plural(periods.today.tripCount, 'trip'), context: `Yesterday ${inr(periods.yesterday.earned)}`,
      action: periods.today.tripCount === 0 ? { label: "Add today's trips →", onClick: () => setTripDialog({ open: true }) } : undefined,
    },
    {
      label: 'This week', icon: CalendarRange, value: periods.week.earned,
      detail: `${plural(periods.week.tripCount, 'trip')} · ${fmtShort(periods.weekRange[0])} – ${fmtShort(periods.weekRange[1])}`,
      context: `Last week ${inr(periods.lastWeek.earned)}`,
    },
    {
      label: 'This month', icon: CalendarIcon, value: periods.month.earned,
      detail: `${plural(periods.month.tripCount, 'trip')} · profit ${inr(periods.month.profit)}`,
      context: `Last month ${inr(periods.lastMonth.earned)}`,
    },
    {
      label: 'Total earned', icon: TrendingUp, value: allTotals.earned,
      detail: `${plural(allTotals.tripCount, 'trip')} · profit ${inr(allTotals.profit)}`,
      context: firstTrip ? `Since ${format(parseISO(firstTrip), 'd MMM yyyy')}` : 'No trips yet',
    },
  ];

  const breakdown = [
    { label: 'Fuel (CNG + petrol)', value: totals.fuel },
    { label: 'Driver', value: totals.driver },
    { label: 'Car EMI', value: totals.emi },
    { label: 'Other', value: totals.other },
  ];

  const filteredExpenses = expenseFilter === ALL ? mExpenses : mExpenses.filter(e => (expenseFilter === 'fuel' ? FUEL_CATEGORIES.includes(e.category) : e.category === expenseFilter));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/investments')}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><CarIcon className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{car.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[car.reg_number, car.partners.join(' & '), car.driver_name && `Driver: ${car.driver_name}`].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setTripDialog({ open: true })}><Plus className="w-4 h-4 mr-1" /> Trip</Button>
          <Button variant="secondary" onClick={() => setExpenseDialog({ open: true })}><Fuel className="w-4 h-4 mr-1" /> Expense</Button>
          <Button variant="outline" onClick={() => openPayment()}><Wallet className="w-4 h-4 mr-1" /> Payment received</Button>
          <Button variant="outline" size="icon" onClick={() => setImportOpen(true)} title="Import from notes"><ClipboardPaste className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={exportCsv} title="Export CSV"><Download className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} title="Car settings"><Settings2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Earnings at a glance */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t.label}</p>
                  <t.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold mt-1">{inr(t.value)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.detail}</p>
                <p className="text-xs text-muted-foreground">{t.context}</p>
                {t.action && (
                  <Button variant="link" className="h-auto p-0 mt-1 text-xs" onClick={t.action.onClick}>{t.action.label}</Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Calendar + who holds what */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 items-start">
        <div className="lg:col-span-3">
          <CarCalendar month={month} onMonthChange={setMonth} days={dayStats} onDayClick={setDayDate} />
        </div>
        <div className="lg:col-span-2">
          <CarProfitSplit
            partners={car.partners}
            totals={allTotals}
            positions={settlement}
            transfers={transfers}
            onRecordPayment={() => openPayment()}
            onSettle={t => setExpenseDialog({
              open: true,
              preset: { category: 'transfer', amount: Math.round(t.amount), paid_by: t.from, paid_to: t.to, notes: 'Settlement' },
            })}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Selected month */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{monthLabel(month)} summary</CardTitle>
            <CardDescription>Follows the month shown in the calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Earned', value: totals.earned, tone: '' },
                { label: 'Spent', value: totals.spent, tone: '' },
                { label: 'Profit', value: totals.profit, tone: totals.profit < 0 ? 'text-rose-500' : '' },
                { label: 'Due from company', value: totals.pending, tone: totals.pending > 0 ? 'text-amber-700 dark:text-amber-400' : '' },
              ].map(x => (
                <div key={x.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{x.label}</p>
                  <p className={cn('text-lg font-semibold', x.tone)}>{inr(x.value)}</p>
                  {x.label === 'Due from company' && (totals.pending > 0 ? (
                    <Button variant="link" className="h-auto p-0 text-xs" onClick={() => openPayment(month)}>Record payment →</Button>
                  ) : totals.received > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      All trips marked as paid ·{' '}
                      <UndoPaymentButton month={month} label="Not paid yet?" onConfirm={() => d.undoPayments(`${month}-01`, monthEnd(month))} />
                    </p>
                  ) : null)}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Where the money went</p>
              {breakdown.map(b => (
                <div key={b.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium">{inr(b.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#eb6834]/15 dark:bg-[#d95926]/20 overflow-hidden">
                    <div className="h-full rounded-full bg-[#eb6834] dark:bg-[#d95926]" style={{ width: `${totals.spent ? (b.value / totals.spent) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
              {totals.tripCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Avg {inr(totals.earned / totals.tripCount)} per trip · fuel {inr(totals.fuel / Math.max(1, days))} per working day ({fuelPct}% of earnings) · net {inr(totals.profit / Math.max(1, days))} per day
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly dues · {monthLabel(month)}</CardTitle>
            <CardDescription>Set amounts in car settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Car EMI', expected: car.monthly_emi, paid: emiPaid, due: emiDue, category: 'emi', day: car.emi_day },
              { label: `Driver${car.driver_name ? ` (${car.driver_name})` : ''}`, expected: car.driver_salary, paid: driverPaid, due: driverDue, category: 'driver', day: null },
            ].map(r => (
              <div key={r.category} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {r.expected > 0 && r.due === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                    {r.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.expected > 0 ? `Paid ${inr(r.paid)} of ${inr(r.expected)}${r.day ? ` · due on ${r.day}` : ''}` : r.paid > 0 ? `Paid ${inr(r.paid)}` : 'Not set'}
                  </p>
                </div>
                {r.due > 0 ? (
                  <Button size="sm" variant="outline" onClick={() => setExpenseDialog({
                    open: true,
                    preset: { category: r.category, amount: r.due, expense_date: presetDate(r.day), notes: `${r.label} – ${monthLabel(month)}` },
                  })}>
                    Pay {inr(r.due)}
                  </Button>
                ) : r.expected === 0 ? (
                  <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>Set</Button>
                ) : null}
              </div>
            ))}
            {(emiDue > 0 || driverDue > 0) && (
              <p className="text-xs text-muted-foreground">
                After paying the remaining dues, this month's profit would be{' '}
                <span className={cn('font-semibold', projectedProfit >= 0 ? 'text-foreground' : 'text-rose-500')}>{inr(projectedProfit)}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Details · {monthLabel(month)}</h2>
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="daily">Daily log</TabsTrigger>
            <TabsTrigger value="trips">Trips ({mTrips.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({mExpenses.length})</TabsTrigger>
            <TabsTrigger value="monthly">All months</TabsTrigger>
          </TabsList>

          {/* Daily log */}
          <TabsContent value="daily" className="space-y-3">
            {daily.length === 0 && (
              <EmptyHint month={monthLabel(month)} onTrip={() => setTripDialog({ open: true })} onImport={() => setImportOpen(true)} />
            )}
            {daily.map(day => (
              <Card key={day.date}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <button className="font-semibold hover:underline" onClick={() => setDayDate(day.date)}>{fmtDay(day.date)}</button>
                    <div className="flex gap-3 text-sm">
                      <span><span className="text-muted-foreground">Earned</span> {inr(day.totals.earned)}</span>
                      {day.totals.spent > 0 && <span><span className="text-muted-foreground">Spent</span> {inr(day.totals.spent)}</span>}
                      <span className={cn('font-semibold', day.totals.profit < 0 && 'text-rose-500')}>Net {inr(day.totals.profit)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {day.trips.map(t => (
                      <button key={t.id} onClick={() => setTripDialog({ open: true, trip: t })}
                        className="text-xs rounded-full px-2.5 py-1 border border-primary/40 hover:bg-primary/10">
                        {t.slot} · {inr(t.amount)}
                      </button>
                    ))}
                    {day.expenses.map(e => (
                      <button key={e.id} onClick={() => setExpenseDialog({ open: true, expense: e })}
                        className="text-xs rounded-full px-2.5 py-1 border border-dashed border-border text-muted-foreground hover:bg-muted">
                        {e.category === 'transfer' ? `${e.paid_by} → ${e.paid_to}` : `${categoryLabel(e.category)} (${e.paid_by})`} · {inr(e.amount)}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Trips */}
          <TabsContent value="trips">
            <Card>
              <CardContent className="p-0 divide-y">
                {mTrips.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No trips in {monthLabel(month)}.</p>}
                {mTrips.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.slot}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDay(t.trip_date)}{t.received_by && t.status === 'received' && ` · received by ${t.received_by}`}{t.notes && ` · ${t.notes}`}
                      </p>
                    </div>
                    {t.status === 'received'
                      ? <Badge variant="secondary">Paid</Badge>
                      : <Badge variant="outline" className="text-muted-foreground">Unpaid</Badge>}
                    <span className="font-semibold w-20 text-right">{inr(t.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTripDialog({ open: true, trip: t })}><Pencil className="w-4 h-4" /></Button>
                    <DeleteButton what="trip" onConfirm={() => d.deleteTrip(t.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses */}
          <TabsContent value="expenses" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[{ value: ALL, label: 'All' }, { value: 'fuel', label: 'Fuel' }, ...EXPENSE_CATEGORIES.filter(c => !FUEL_CATEGORIES.includes(c.value))].map(c => (
                <button key={c.value} onClick={() => setExpenseFilter(c.value)}
                  className={cn('px-3 py-1 rounded-full text-xs border', expenseFilter === c.value ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground border-border')}>
                  {c.label}
                </button>
              ))}
            </div>
            <Card>
              <CardContent className="p-0 divide-y">
                {filteredExpenses.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No expenses here.</p>}
                {filteredExpenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3">
                    <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', categoryColor(e.category))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {e.category === 'transfer' ? `${e.paid_by} gave ${e.paid_to}` : `${categoryLabel(e.category)} · paid by ${e.paid_by}`}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{fmtDay(e.expense_date)}{e.notes && ` · ${e.notes}`}</p>
                    </div>
                    <span className="font-semibold w-20 text-right">{inr(e.amount)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpenseDialog({ open: true, expense: e })}><Pencil className="w-4 h-4" /></Button>
                    <DeleteButton what="entry" onConfirm={() => d.deleteExpense(e.id)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All months */}
          <TabsContent value="monthly" className="space-y-4">
            {monthly.length >= 2 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Month by month</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
                    <BarChart
                      data={[...monthly].reverse().map(m => ({ name: monthLabel(m.month), Earned: m.earned, Spent: m.spent, Profit: m.profit }))}
                      barGap={2}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} width={52} tickFormatter={v => inrCompact(Number(v))} />
                      <ChartTooltip
                        cursor={{ fillOpacity: 0.3 }}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => (
                              <div className="flex w-full items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <span className="h-0.5 w-3 rounded-full" style={{ background: item.color }} />{name}
                                </span>
                                <span className="font-semibold text-foreground">{inr(Number(value))}</span>
                              </div>
                            )}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="Earned" fill="var(--color-Earned)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="Spent" fill="var(--color-Spent)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="Profit" fill="var(--color-Profit)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm tabular-nums">
                  <thead className="text-muted-foreground text-xs">
                    <tr className="border-b">
                      {['Month', 'Trips', 'Earned', 'Fuel', 'Driver', 'EMI', 'Other', 'Profit', 'Company payment'].map(h => (
                        <th key={h} className={cn('p-3 font-medium', h === 'Month' ? 'text-left' : 'text-right')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map(m => (
                      <tr key={m.month} className={cn('border-b last:border-0 hover:bg-muted/40 cursor-pointer', m.month === month && 'bg-muted/30')} onClick={() => showMonth(m.month)}>
                        <td className="p-3 font-medium">{monthLabel(m.month)}</td>
                        <td className="p-3 text-right">{m.tripCount}</td>
                        <td className="p-3 text-right">{inr(m.earned)}</td>
                        <td className="p-3 text-right">{inr(m.fuel)}</td>
                        <td className="p-3 text-right">{inr(m.driver)}</td>
                        <td className="p-3 text-right">{inr(m.emi)}</td>
                        <td className="p-3 text-right">{inr(m.other)}</td>
                        <td className={cn('p-3 text-right font-semibold', m.profit < 0 && 'text-rose-500')}>{inr(m.profit)}</td>
                        <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {m.pending > 0 ? (
                              <Button size="sm" variant="outline" className="h-7" onClick={() => openPayment(m.month)}>
                                {inr(m.pending)} due
                              </Button>
                            ) : m.received > 0 ? (
                              <span className="text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Paid</span>
                            ) : '–'}
                            {m.received > 0 && (
                              <UndoPaymentButton month={m.month} onConfirm={() => d.undoPayments(`${m.month}-01`, monthEnd(m.month))} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {monthly.length > 1 && (
                      <tr className="bg-muted/30 font-semibold">
                        <td className="p-3">Total</td>
                        <td className="p-3 text-right">{allTotals.tripCount}</td>
                        <td className="p-3 text-right">{inr(allTotals.earned)}</td>
                        <td className="p-3 text-right">{inr(allTotals.fuel)}</td>
                        <td className="p-3 text-right">{inr(allTotals.driver)}</td>
                        <td className="p-3 text-right">{inr(allTotals.emi)}</td>
                        <td className="p-3 text-right">{inr(allTotals.other)}</td>
                        <td className={cn('p-3 text-right', allTotals.profit < 0 && 'text-rose-500')}>{inr(allTotals.profit)}</td>
                        <td className="p-3 text-right">{allTotals.pending > 0 && `${inr(allTotals.pending)} due`}</td>
                      </tr>
                    )}
                    {monthly.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No data yet.</td></tr>}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TripDialog
        open={tripDialog.open}
        onOpenChange={o => setTripDialog(s => ({ ...s, open: o }))}
        car={car}
        trip={tripDialog.trip}
        defaultDate={tripDialog.date}
        lastAmount={lastAmount}
        onSave={d.addTrips}
        onUpdate={d.updateTrip}
      />
      <ExpenseDialog
        open={expenseDialog.open}
        onOpenChange={o => setExpenseDialog(s => ({ ...s, open: o }))}
        car={car}
        expense={expenseDialog.expense}
        preset={expenseDialog.preset}
        onSave={d.addExpenses}
        onUpdate={d.updateExpense}
      />
      <DayDetailDialog
        date={dayDate}
        onOpenChange={o => { if (!o) setDayDate(null); }}
        trips={trips}
        expenses={expenses}
        onAddTrip={date => { setDayDate(null); setTripDialog({ open: true, date }); }}
        onAddExpense={date => { setDayDate(null); setExpenseDialog({ open: true, preset: { expense_date: date } }); }}
        onEditTrip={trip => { setDayDate(null); setTripDialog({ open: true, trip }); }}
        onEditExpense={expense => { setDayDate(null); setExpenseDialog({ open: true, expense }); }}
      />
      <CarImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        car={car}
        onImport={async (t, e) => (await d.addTrips(t)) && (await d.addExpenses(e))}
      />
      <CarFormDialog open={settingsOpen} onOpenChange={setSettingsOpen} car={car} onSubmit={d.updateCar} />
      <PaymentDialog
        open={paymentCutoff !== null}
        onOpenChange={o => { if (!o) setPaymentCutoff(null); }}
        car={car}
        trips={trips}
        initialCutoff={paymentCutoff ?? ''}
        onSave={d.recordPayment}
        onUndoPaid={cutoff => d.undoPayments(null, cutoff)}
      />
    </div>
  );
};

const UndoPaymentButton: React.FC<{ month: string; label?: string; onConfirm: () => void }> = ({ month, label, onConfirm }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {label ? (
        <Button variant="link" className="h-auto p-0 text-xs">{label}</Button>
      ) : (
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Undo payment">
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      )}
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Mark {monthLabel(month)} trips as unpaid?</AlertDialogTitle>
        <AlertDialogDescription>
          Use this if the company hasn't paid them yet. Any company deduction or bonus saved with a payment is removed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Mark unpaid</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const EmptyHint: React.FC<{ month: string; onTrip: () => void; onImport: () => void }> = ({ month, onTrip, onImport }) => (
  <Card className="text-center py-10">
    <CardContent>
      <CarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
      <p className="font-semibold mb-1">Nothing logged in {month}</p>
      <p className="text-sm text-muted-foreground mb-4">Add trips as you go, or paste your existing notes to bring them in.</p>
      <div className="flex justify-center gap-2">
        <Button onClick={onTrip}><Plus className="w-4 h-4 mr-1" /> Add trip</Button>
        <Button variant="outline" onClick={onImport}><ClipboardPaste className="w-4 h-4 mr-1" /> Import notes</Button>
      </div>
    </CardContent>
  </Card>
);

export default CarDashboard;
