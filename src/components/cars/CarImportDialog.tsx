import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EXPENSE_CATEGORIES, inr } from '@/lib/carBusiness';
import { parseCarNotes, type ParsedRow } from '@/lib/carNotesParser';
import type { Car, TripInput, ExpenseInput } from '@/hooks/useCarBusiness';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  car: Car;
  onImport: (trips: TripInput[], expenses: ExpenseInput[]) => Promise<boolean>;
}

export const CarImportDialog: React.FC<Props> = ({ open, onOpenChange, car, onImport }) => {
  const [text, setText] = useState('');
  const [defaultDate, setDefaultDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const reset = () => { setRows(null); setSkipped([]); };

  const parse = () => {
    const res = parseCarNotes(text, { partners: car.partners, driverName: car.driver_name, defaultDate });
    setRows(res.rows);
    setSkipped(res.skipped);
  };

  const update = (i: number, patch: Partial<ParsedRow>) =>
    setRows(prev => prev!.map((r, idx) => (idx === i ? ({ ...r, ...patch } as ParsedRow) : r)));

  const totals = useMemo(() => {
    const t = { trips: 0, earned: 0, expenses: 0, spent: 0 };
    rows?.forEach(r => {
      if (r.kind === 'trip') { t.trips++; t.earned += r.amount; }
      else { t.expenses++; if (r.category !== 'transfer') t.spent += r.amount; }
    });
    return t;
  }, [rows]);

  const doImport = async () => {
    if (!rows?.length) return;
    setSaving(true);
    const trips: TripInput[] = [];
    const expenses: ExpenseInput[] = [];
    rows.forEach(r => {
      if (r.kind === 'trip') {
        trips.push({ trip_date: r.date, slot: r.slot, amount: r.amount, status: 'pending', received_by: null, notes: null });
      } else {
        expenses.push({ expense_date: r.date, category: r.category, amount: r.amount, paid_by: r.paidBy, paid_to: null, notes: r.notes });
      }
    });
    const ok = await onImport(trips, expenses);
    setSaving(false);
    if (ok) { setText(''); reset(); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from notes</DialogTitle>
          <DialogDescription>
            Paste the notes you already keep. Lines like <code>1650 - 2nd(2pm) - 14/oct</code> become trips, and lines with
            "paid" like <code>764 paid for cng - santhu paid</code> become expenses. Trips are saved as unpaid until you
            record the company payment. Check the preview before saving.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="space-y-4">
            <Textarea
              rows={12}
              value={text}
              onChange={e => setText(e.target.value)}
              className="font-mono text-sm"
              placeholder={'1650 - 2nd - 12/oct/26\n1650 ot drop 8pm - 13/oct\n1650+1650 - 2nd(2pm) - 14/oct\n\n1k paid to vijay (12/oct) - santhu paid.\n500 paid for petrol - dude paid.'}
            />
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label>Date for lines without a date</Label>
                <Input type="date" value={defaultDate} onChange={e => setDefaultDate(e.target.value)} className="w-44" />
              </div>
              <Button onClick={parse} disabled={!text.trim()} className="ml-auto">Preview</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{totals.trips} trips · {inr(totals.earned)}</Badge>
              <Badge variant="secondary">{totals.expenses} expenses · {inr(totals.spent)}</Badge>
              {skipped.length > 0 && <Badge variant="destructive">{skipped.length} lines skipped</Badge>}
            </div>

            <div className="border rounded-lg divide-y">
              {rows.map((r, i) => (
                <div key={i} className="p-2.5 flex flex-wrap items-center gap-2">
                  <Badge className={r.kind === 'trip' ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-rose-600 hover:bg-rose-600'}>
                    {r.kind === 'trip' ? 'Trip' : 'Expense'}
                  </Badge>
                  <Input type="date" value={r.date} onChange={e => update(i, { date: e.target.value })} className="w-40 h-8" />
                  <Input
                    type="number"
                    value={r.amount}
                    onChange={e => update(i, { amount: parseFloat(e.target.value) || 0 })}
                    className="w-24 h-8"
                  />
                  {r.kind === 'trip' ? (
                    <Input value={r.slot} onChange={e => update(i, { slot: e.target.value })} className="w-44 h-8" />
                  ) : (
                    <>
                      <Select value={r.category} onValueChange={v => update(i, { category: v })}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.filter(c => c.value !== 'transfer' && c.value !== 'deduction').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={r.paidBy} onValueChange={v => update(i, { paidBy: v })}>
                        <SelectTrigger className="w-28 h-8"><SelectValue placeholder="Paid by" /></SelectTrigger>
                        <SelectContent>{car.partners.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground truncate flex-1 min-w-[120px]" title={r.source}>{r.source}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRows(prev => prev!.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing recognised.</p>}
            </div>

            {skipped.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Skipped (add manually):</p>
                {skipped.map((s, i) => <p key={i} className="font-mono">{s}</p>)}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={doImport} disabled={!rows.length || saving}>Import {rows.length} entries</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
