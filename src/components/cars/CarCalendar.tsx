import React from 'react';
import { addDays, addMonths, endOfMonth, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Fuel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { inr, inrCompact, categoryLabel, computeTotals, type DayStat } from '@/lib/carBusiness';
import type { CarTrip, CarExpense } from '@/hooks/useCarBusiness';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// One-hue sequential steps on the theme's primary, validated per mode: each step
// clears 2:1 against the card and its text clears 4.5:1 (ink flips on darker steps).
const HEAT = [
  'bg-muted/50 text-muted-foreground',
  'bg-primary/[0.36] dark:bg-primary/[0.35] text-foreground',
  'bg-primary/[0.72] text-primary-foreground',
  'bg-primary text-primary-foreground',
];
const heat = (trips: number) => HEAT[Math.min(trips, 3)];

// Shows the full amount on wider screens and the short form on phones
const Money: React.FC<{ value: number }> = ({ value }) => (
  <>
    <span className="sm:hidden">{inrCompact(value)}</span>
    <span className="hidden sm:inline">{inr(value)}</span>
  </>
);

interface CalendarProps {
  month: string; // yyyy-MM
  onMonthChange: (month: string) => void;
  days: Record<string, DayStat>;
  onDayClick: (date: string) => void;
}

export const CarCalendar: React.FC<CalendarProps> = ({ month, onMonthChange, days, onDayClick }) => {
  const first = parseISO(`${month}-01`);
  const today = format(new Date(), 'yyyy-MM-dd');
  const atCurrentMonth = month >= today.slice(0, 7);

  const weeks: string[][] = [];
  const last = endOfWeek(endOfMonth(first), { weekStartsOn: 1 });
  for (let d = startOfWeek(first, { weekStartsOn: 1 }); d <= last; d = addDays(d, 1)) {
    if (!weeks.length || weeks[weeks.length - 1].length === 7) weeks.push([]);
    weeks[weeks.length - 1].push(format(d, 'yyyy-MM-dd'));
  }

  const inMonth = Object.entries(days).filter(([d]) => d.startsWith(month)).map(([, s]) => s);
  const monthEarned = inMonth.reduce((s, d) => s + d.earned, 0);
  const monthTrips = inMonth.reduce((s, d) => s + d.trips, 0);
  const workDays = inMonth.filter(d => d.trips > 0).length;

  const shift = (n: number) => onMonthChange(format(addMonths(first, n), 'yyyy-MM'));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Trips calendar</CardTitle>
            <CardDescription>Darker days had more trips · tap a day for details</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold w-28 text-center">{format(first, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(1)} disabled={atCurrentMonth} aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm pt-1">
          <span><span className="text-muted-foreground">Earned</span> <b>{inr(monthEarned)}</b></span>
          <span><span className="text-muted-foreground">Trips</span> <b>{monthTrips}</b></span>
          <span><span className="text-muted-foreground">Working days</span> <b>{workDays}</b></span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_auto] gap-0.5">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-[10px] sm:text-xs text-muted-foreground text-center pb-1">{w}</div>
          ))}
          <div className="text-[10px] sm:text-xs text-muted-foreground text-right pb-1 pl-2">Week</div>

          {weeks.map(week => {
            const weekEarned = week.reduce((s, d) => s + (days[d]?.earned ?? 0), 0);
            return (
              <React.Fragment key={week[0]}>
                {week.map(date => {
                  const s = days[date];
                  const trips = s?.trips ?? 0;
                  const outside = !date.startsWith(month);
                  const future = date > today;
                  return (
                    <Tooltip key={date} delayDuration={150}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={future}
                          onClick={() => onDayClick(date)}
                          aria-label={`${format(parseISO(date), 'EEEE d MMMM')}: ${trips} trips, earned ${inr(s?.earned ?? 0)}`}
                          className={cn(
                            'relative flex flex-col rounded-md p-1 sm:p-1.5 min-h-[50px] sm:min-h-[68px] text-left transition',
                            'hover:ring-2 hover:ring-inset hover:ring-foreground/40',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                            'disabled:cursor-default disabled:hover:ring-0',
                            heat(trips),
                            outside && 'opacity-40',
                            future && 'opacity-30',
                            date === today && 'ring-2 ring-inset ring-foreground/70',
                          )}
                        >
                          <span className="text-[10px] sm:text-xs font-medium leading-none">{Number(date.slice(8))}</span>
                          {trips > 0 && (
                            <span className="mt-auto leading-tight">
                              <span className="block text-[10px] sm:text-xs font-semibold">
                                {trips}<span className="hidden sm:inline"> trip{trips > 1 && 's'}</span>
                              </span>
                              <span className="block text-[10px] sm:text-xs"><Money value={s.earned} /></span>
                            </span>
                          )}
                          {(s?.spent ?? 0) > 0 && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-card" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold text-sm">{inr(s?.earned ?? 0)} earned</p>
                        <p className="text-muted-foreground">
                          {trips} trip{trips !== 1 && 's'} · {format(parseISO(date), 'EEE d MMM')}
                        </p>
                        {(s?.spent ?? 0) > 0 && <p className="text-muted-foreground">Spent {inr(s.spent)}</p>}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                <div className="flex items-center justify-end pl-2 text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                  {weekEarned > 0 ? <Money value={weekEarned} /> : <span className="text-muted-foreground font-normal">–</span>}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Scale legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Trips per day</span>
            {['0', '1', '2', '3+'].map((label, i) => (
              <span key={label} className="flex items-center gap-1">
                <span className={cn('w-3.5 h-3.5 rounded-sm', HEAT[i].split(' ').filter(c => c.includes('bg-')).join(' '))} />
                {label}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> money spent that day
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- Day details ----------

interface DayDialogProps {
  date: string | null;
  onOpenChange: (open: boolean) => void;
  trips: CarTrip[];
  expenses: CarExpense[];
  onAddTrip: (date: string) => void;
  onAddExpense: (date: string) => void;
  onEditTrip: (trip: CarTrip) => void;
  onEditExpense: (expense: CarExpense) => void;
}

export const DayDetailDialog: React.FC<DayDialogProps> = ({
  date, onOpenChange, trips, expenses, onAddTrip, onAddExpense, onEditTrip, onEditExpense,
}) => {
  const dayTrips = date ? trips.filter(t => t.trip_date === date) : [];
  const dayExpenses = date ? expenses.filter(e => e.expense_date === date) : [];
  const t = computeTotals(dayTrips, dayExpenses);

  return (
    <Dialog open={!!date} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {date && (
          <>
            <DialogHeader>
              <DialogTitle>{format(parseISO(date), 'EEEE, d MMMM yyyy')}</DialogTitle>
              <DialogDescription>
                {t.tripCount} trip{t.tripCount !== 1 && 's'} · earned {inr(t.earned)}
                {t.spent > 0 && ` · spent ${inr(t.spent)}`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Earned', value: t.earned },
                { label: 'Spent', value: t.spent },
                { label: 'Net', value: t.profit },
              ].map(x => (
                <div key={x.label} className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">{x.label}</p>
                  <p className={cn('font-semibold', x.label === 'Net' && x.value < 0 && 'text-rose-500')}>{inr(x.value)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Trips</p>
              {dayTrips.length === 0 && <p className="text-sm text-muted-foreground">No trips logged.</p>}
              {dayTrips.map(tr => (
                <button key={tr.id} onClick={() => onEditTrip(tr)} className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted text-left">
                  <span className="text-sm">{tr.slot}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant={tr.status === 'received' ? 'secondary' : 'outline'} className="text-[10px]">
                      {tr.status === 'received' ? 'Paid' : 'Unpaid'}
                    </Badge>
                    <span className="text-sm font-semibold">{inr(tr.amount)}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Expenses</p>
              {dayExpenses.length === 0 && <p className="text-sm text-muted-foreground">No expenses.</p>}
              {dayExpenses.map(e => (
                <button key={e.id} onClick={() => onEditExpense(e)} className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted text-left">
                  <span className="text-sm">
                    {e.category === 'transfer' ? `${e.paid_by} → ${e.paid_to}` : `${categoryLabel(e.category)} · ${e.paid_by}`}
                  </span>
                  <span className="text-sm font-semibold">{inr(e.amount)}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => onAddTrip(date)}><Plus className="w-4 h-4 mr-1" /> Add trip</Button>
              <Button variant="secondary" onClick={() => onAddExpense(date)}><Fuel className="w-4 h-4 mr-1" /> Add expense</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
