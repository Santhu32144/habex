import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, SLOT_PRESETS, BONUS_SLOT, inr } from '@/lib/carBusiness';
import type { Car, CarTrip, CarExpense, TripInput, ExpenseInput } from '@/hooks/useCarBusiness';

const today = () => format(new Date(), 'yyyy-MM-dd');

const Chips: React.FC<{ options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(o => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={cn(
          'px-3 py-1.5 rounded-full text-sm border transition-colors',
          value === o.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ---------- Trip ----------

interface TripDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  car: Car;
  trip?: CarTrip | null;
  defaultDate?: string;
  lastAmount?: number;
  onSave: (rows: TripInput[]) => Promise<boolean | void>;
  onUpdate: (id: string, data: Partial<TripInput>) => Promise<void>;
}

export const TripDialog: React.FC<TripDialogProps> = ({ open, onOpenChange, car, trip, defaultDate, lastAmount, onSave, onUpdate }) => {
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState<string[]>([SLOT_PRESETS[0]]);
  const [customSlot, setCustomSlot] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (trip) {
      setDate(trip.trip_date);
      const preset = SLOT_PRESETS.includes(trip.slot);
      setSlots(preset ? [trip.slot] : []);
      setCustomSlot(preset ? '' : trip.slot);
      setAmount(String(trip.amount));
      setNotes(trip.notes || '');
    } else {
      setDate(defaultDate || today());
      setSlots([SLOT_PRESETS[0]]);
      setCustomSlot('');
      setAmount(String(lastAmount || car.default_trip_amount || ''));
      setNotes('');
    }
  }, [open, trip, car, lastAmount, defaultDate]);

  const toggleSlot = (s: string) => {
    // Editing changes one row, so only one slot; adding can log both trips at once
    if (trip) { setSlots([s]); setCustomSlot(''); return; }
    setSlots(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
  };

  const allSlots = [...slots, ...(customSlot.trim() ? [customSlot.trim()] : [])];
  const amt = parseFloat(amount);
  const valid = allSlots.length > 0 && amt >= 0 && !isNaN(amt) && !!date;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const base = { trip_date: date, amount: amt, notes: notes.trim() || null };
    if (trip) {
      await onUpdate(trip.id, { ...base, slot: allSlots[0] });
      onOpenChange(false);
    } else if (await onSave(allSlots.map(slot => ({ ...base, slot, status: 'pending' as const, received_by: null })))) {
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{trip ? 'Edit trip' : 'Add trip earning'}</DialogTitle>
          <DialogDescription>{trip ? 'Update this trip.' : 'Pick both slots to log the whole day in one go.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount per trip (₹)</Label>
              <Input type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1650" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Trip</Label>
            <div className="flex flex-wrap gap-2">
              {SLOT_PRESETS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSlot(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    slots.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <Input value={customSlot} onChange={e => { setCustomSlot(e.target.value); if (trip && e.target.value) setSlots([]); }} placeholder="Other trip (e.g. Airport drop)" />
          </div>
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />
          {trip?.status === 'received' && (
            <p className="text-xs text-emerald-500">Paid by company{trip.received_by && ` · received by ${trip.received_by}`}</p>
          )}
          {!trip && allSlots.length > 1 && !isNaN(amt) && (
            <p className="text-sm text-muted-foreground">Adds {allSlots.length} trips · total ₹{(amt * allSlots.length).toLocaleString('en-IN')}</p>
          )}
          <Button className="w-full" onClick={save} disabled={!valid || saving}>{trip ? 'Save changes' : 'Add'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Expense ----------

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  car: Car;
  expense?: CarExpense | null;
  preset?: Partial<ExpenseInput> | null;
  onSave: (rows: ExpenseInput[]) => Promise<boolean | void>;
  onUpdate: (id: string, data: Partial<ExpenseInput>) => Promise<void>;
}

export const ExpenseDialog: React.FC<ExpenseDialogProps> = ({ open, onOpenChange, car, expense, preset, onSave, onUpdate }) => {
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState('cng');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src = expense ?? preset ?? {};
    setDate(src.expense_date || today());
    setCategory(src.category || 'cng');
    setAmount(src.amount != null ? String(src.amount) : '');
    setPaidBy(src.paid_by || car.partners[0] || '');
    setPaidTo(src.paid_to || car.partners[1] || '');
    setNotes(src.notes || '');
  }, [open, expense, preset, car]);

  const amt = parseFloat(amount);
  const isTransfer = category === 'transfer';
  const valid = amt > 0 && !!paidBy.trim() && !!date && (!isTransfer || (!!paidTo && paidTo !== paidBy));

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const row: ExpenseInput = {
      expense_date: date, category, amount: amt, paid_by: paidBy.trim(),
      paid_to: isTransfer ? paidTo : null, notes: notes.trim() || null,
    };
    if (expense) {
      await onUpdate(expense.id, row);
      onOpenChange(false);
    } else if (await onSave([row])) {
      onOpenChange(false);
    }
    setSaving(false);
  };

  const partnerChips = car.partners.map(p => ({ value: p, label: p }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit entry' : 'Add expense'}</DialogTitle>
          <DialogDescription>Fuel, driver payment, EMI, or money moved between partners.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Chips options={EXPENSE_CATEGORIES.filter(c => c.value !== 'deduction' || category === 'deduction')} value={category} onChange={setCategory} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" autoFocus={!expense} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isTransfer ? 'From' : 'Paid by'}</Label>
            {partnerChips.length ? (
              <Chips options={partnerChips} value={paidBy} onChange={setPaidBy} />
            ) : (
              <Input value={paidBy} onChange={e => setPaidBy(e.target.value)} placeholder="Name" />
            )}
          </div>
          {isTransfer && (
            <div className="space-y-1.5">
              <Label>To</Label>
              <Chips options={partnerChips.filter(p => p.value !== paidBy)} value={paidTo} onChange={setPaidTo} />
            </div>
          )}
          <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={category === 'driver' ? `e.g. Advance to ${car.driver_name || 'driver'}` : 'Notes (optional)'} />
          <Button className="w-full" onClick={save} disabled={!valid || saving}>{expense ? 'Save changes' : 'Add'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------- Company payment ----------

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  car: Car;
  trips: CarTrip[];
  initialCutoff: string;
  onSave: (p: { cutoff: string; receivedBy: string; diff: number; adjustDate: string; reason?: string }) => Promise<boolean>;
  onUndoPaid: (cutoff: string) => Promise<void>;
}

const fmtShort = (d: string) => format(parseISO(d), 'd MMM yyyy');

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ open, onOpenChange, car, trips, initialCutoff, onSave, onUndoPaid }) => {
  const [cutoff, setCutoff] = useState(initialCutoff);
  const [amount, setAmount] = useState('');
  const [amountEdited, setAmountEdited] = useState(false);
  const [receivedBy, setReceivedBy] = useState('');
  const [reason, setReason] = useState('');
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCutoff(initialCutoff);
    setAmountEdited(false);
    setReceivedBy(car.partners[0] || '');
    setReason('');
    setConfirmUndo(false);
  }, [open, initialCutoff, car]);

  const covered = useMemo(
    () => trips.filter(t => t.status !== 'received' && t.trip_date <= cutoff).sort((a, b) => a.trip_date.localeCompare(b.trip_date)),
    [trips, cutoff],
  );
  const total = covered.reduce((s, t) => s + Number(t.amount), 0);
  const alreadyPaid = trips.filter(t => t.status === 'received' && t.slot !== BONUS_SLOT && t.trip_date <= cutoff).length;

  const undoPaid = async () => {
    setSaving(true);
    await onUndoPaid(cutoff);
    setSaving(false);
    setConfirmUndo(false);
  };

  // Follow the trips total until the user types their own amount
  useEffect(() => {
    if (!amountEdited) setAmount(total ? String(total) : '');
  }, [total, amountEdited]);

  const amt = parseFloat(amount);
  const diff = isNaN(amt) ? 0 : Math.round(amt - total);
  const valid = covered.length > 0 && amt > 0 && !!receivedBy.trim();

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const ok = await onSave({
      cutoff,
      receivedBy: receivedBy.trim(),
      diff,
      adjustDate: covered[covered.length - 1].trip_date,
      reason: reason.trim() || undefined,
    });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Company payment received</DialogTitle>
          <DialogDescription>Marks all unpaid trips up to the date below as paid.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Payment covers trips up to</Label>
            <Input type="date" value={cutoff} onChange={e => setCutoff(e.target.value)} />
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            {covered.length ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {covered.length} unpaid trip{covered.length > 1 && 's'} · {fmtShort(covered[0].trip_date)} – {fmtShort(covered[covered.length - 1].trip_date)}
                </span>
                <span className="font-semibold">{inr(total)}</span>
              </div>
            ) : alreadyPaid > 0 ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  All {alreadyPaid} trip{alreadyPaid > 1 && 's'} up to this date are already marked as <b className="text-foreground">paid</b>.
                </p>
                {confirmUndo ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs">Mark them as unpaid?</span>
                    <Button size="sm" onClick={undoPaid} disabled={saving}>Yes, mark unpaid</Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmUndo(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setConfirmUndo(true)}>Company hasn't paid them yet? Mark as unpaid</Button>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">No trips logged up to this date.</span>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Amount received (₹)</Label>
            <Input type="number" inputMode="numeric" value={amount} onChange={e => { setAmount(e.target.value); setAmountEdited(true); }} />
          </div>
          {covered.length > 0 && diff !== 0 && amt > 0 && (
            <div className="space-y-1.5">
              <p className={cn('text-sm', diff < 0 ? 'text-rose-500' : 'text-emerald-500')}>
                {diff < 0
                  ? `${inr(-diff)} less than the trips total. It will be saved as a company deduction.`
                  : `${inr(diff)} more than the trips total. It will be saved as a company bonus.`}
              </p>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder={diff < 0 ? 'Reason (e.g. commission, TDS)' : 'Reason (optional)'} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Received by</Label>
            {car.partners.length ? (
              <Chips options={car.partners.map(p => ({ value: p, label: p }))} value={receivedBy} onChange={setReceivedBy} />
            ) : (
              <Input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Name" />
            )}
          </div>
          <Button className="w-full" onClick={save} disabled={!valid || saving}>Save payment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
