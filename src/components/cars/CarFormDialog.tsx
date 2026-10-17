import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Car, CarInput } from '@/hooks/useCarBusiness';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  car?: Car | null;
  onSubmit: (data: CarInput) => Promise<unknown>;
}

const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

export const CarFormDialog: React.FC<Props> = ({ open, onOpenChange, car, onSubmit }) => {
  const [f, setF] = useState({
    name: '', reg_number: '', partners: '', shared_emails: '', monthly_emi: '', emi_day: '',
    driver_name: '', driver_salary: '', default_trip_amount: '', start_date: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF({
      name: car?.name ?? '',
      reg_number: car?.reg_number ?? '',
      partners: car ? car.partners.join(', ') : 'Santhu, Dude',
      shared_emails: car?.shared_emails.join(', ') ?? '',
      monthly_emi: car?.monthly_emi ? String(car.monthly_emi) : '',
      emi_day: car?.emi_day ? String(car.emi_day) : '',
      driver_name: car?.driver_name ?? '',
      driver_salary: car?.driver_salary ? String(car.driver_salary) : '',
      default_trip_amount: car?.default_trip_amount ? String(car.default_trip_amount) : '1650',
      start_date: car?.start_date ?? '',
    });
  }, [open, car]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const num = (s: string) => (s.trim() ? Number(s) || 0 : 0);

  const submit = async () => {
    if (!f.name.trim()) return;
    setSaving(true);
    await onSubmit({
      name: f.name.trim(),
      reg_number: f.reg_number.trim() || null,
      partners: splitList(f.partners),
      shared_emails: splitList(f.shared_emails).map(e => e.toLowerCase()),
      monthly_emi: num(f.monthly_emi),
      emi_day: f.emi_day ? Math.min(31, Math.max(1, num(f.emi_day))) : null,
      driver_name: f.driver_name.trim() || null,
      driver_salary: num(f.driver_salary),
      default_trip_amount: num(f.default_trip_amount),
      start_date: f.start_date || null,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{car ? 'Car settings' : 'Add car'}</DialogTitle>
          <DialogDescription>Monthly EMI and driver salary are used for the monthly reminders and the profit view.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Car name *</Label>
              <Input value={f.name} onChange={set('name')} placeholder="e.g. Ertiga" />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Reg. number</Label>
              <Input value={f.reg_number} onChange={set('reg_number')} placeholder="KA 01 AB 1234" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Partners (comma separated)</Label>
            <Input value={f.partners} onChange={set('partners')} placeholder="Santhu, Dude" />
            <p className="text-xs text-muted-foreground">Profit is split equally between partners.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Share with (partner login emails)</Label>
            <Input value={f.shared_emails} onChange={set('shared_emails')} placeholder="friend@gmail.com" />
            <p className="text-xs text-muted-foreground">They can view and add entries when signed in with that email.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Car EMI / month (₹)</Label>
              <Input type="number" value={f.monthly_emi} onChange={set('monthly_emi')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>EMI due day</Label>
              <Input type="number" min={1} max={31} value={f.emi_day} onChange={set('emi_day')} placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <Label>Driver name</Label>
              <Input value={f.driver_name} onChange={set('driver_name')} placeholder="Vijay" />
            </div>
            <div className="space-y-1.5">
              <Label>Driver salary / month (₹)</Label>
              <Input type="number" value={f.driver_salary} onChange={set('driver_salary')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Default trip amount (₹)</Label>
              <Input type="number" value={f.default_trip_amount} onChange={set('default_trip_amount')} placeholder="1650" />
            </div>
            <div className="space-y-1.5">
              <Label>Attached since</Label>
              <Input type="date" value={f.start_date} onChange={set('start_date')} />
            </div>
          </div>
          <Button className="w-full" onClick={submit} disabled={!f.name.trim() || saving}>{car ? 'Save' : 'Add car'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
