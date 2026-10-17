import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BONUS_SLOT } from '@/lib/carBusiness';

// Car tables are not in the generated Supabase types yet, so use the untyped client
const db = supabase as unknown as SupabaseClient;

export interface Car {
  id: string;
  name: string;
  reg_number: string | null;
  partners: string[];
  shared_emails: string[];
  monthly_emi: number;
  emi_day: number | null;
  driver_name: string | null;
  driver_salary: number;
  default_trip_amount: number;
  start_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface CarTrip {
  id: string;
  car_id: string;
  trip_date: string;
  slot: string;
  amount: number;
  status: 'received' | 'pending';
  received_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface CarExpense {
  id: string;
  car_id: string;
  expense_date: string;
  category: string;
  amount: number;
  paid_by: string;
  paid_to: string | null;
  notes: string | null;
  created_at: string;
}

export type CarInput = Partial<Omit<Car, 'id' | 'created_by' | 'created_at'>> & { name: string };
export type TripInput = Omit<CarTrip, 'id' | 'car_id' | 'created_at'>;
export type ExpenseInput = Omit<CarExpense, 'id' | 'car_id' | 'created_at'>;

export function useCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [summaries, setSummaries] = useState<Record<string, { earned: number; spent: number }>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCars = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db.from('cars').select('*').order('created_at', { ascending: false });
    if (error) {
      // Table missing until the migration is applied; stay quiet so the Groups page still works
      if (!/cars/.test(error.message)) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setCars([]);
      setLoading(false);
      return;
    }
    const list = (data as Car[]) || [];
    setCars(list);
    if (list.length) {
      const ids = list.map(c => c.id);
      const [tRes, eRes] = await Promise.all([
        db.from('car_trips').select('car_id, amount').in('car_id', ids),
        db.from('car_expenses').select('car_id, amount, category').in('car_id', ids),
      ]);
      const sums: Record<string, { earned: number; spent: number }> = {};
      ids.forEach(id => { sums[id] = { earned: 0, spent: 0 }; });
      (tRes.data as Pick<CarTrip, 'car_id' | 'amount'>[] || []).forEach(t => { sums[t.car_id].earned += Number(t.amount); });
      (eRes.data as Pick<CarExpense, 'car_id' | 'amount' | 'category'>[] || []).forEach(e => {
        if (e.category !== 'transfer') sums[e.car_id].spent += Number(e.amount);
      });
      setSummaries(sums);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const createCar = async (input: CarInput) => {
    if (!user) return null;
    const { data, error } = await db.from('cars').insert({ ...input, created_by: user.id }).select().maybeSingle();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    toast({ title: 'Car added!', description: `"${input.name}" is ready for tracking.` });
    await fetchCars();
    return data as Car;
  };

  const deleteCar = async (id: string) => {
    const { error } = await db.from('cars').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await fetchCars();
  };

  return { cars, summaries, loading, fetchCars, createCar, deleteCar };
}

export function useCarDetails(carId: string | undefined) {
  const [car, setCar] = useState<Car | null>(null);
  const [trips, setTrips] = useState<CarTrip[]>([]);
  const [expenses, setExpenses] = useState<CarExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fail = (error: { message: string }) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); };

  const fetchAll = useCallback(async (showLoading = true) => {
    if (!carId || !user) return;
    if (showLoading) setLoading(true);
    const [cRes, tRes, eRes] = await Promise.all([
      db.from('cars').select('*').eq('id', carId).maybeSingle(),
      db.from('car_trips').select('*').eq('car_id', carId).order('trip_date', { ascending: false }).order('created_at', { ascending: false }),
      db.from('car_expenses').select('*').eq('car_id', carId).order('expense_date', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    if (cRes.error) toast({ title: 'Error', description: cRes.error.message, variant: 'destructive' });
    setCar(cRes.data || null);
    setTrips(tRes.data || []);
    setExpenses(eRes.data || []);
    setLoading(false);
  }, [carId, user, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isOwner = !!car && user?.id === car.created_by;

  const updateCar = async (data: Partial<CarInput>) => {
    const { error } = await db.from('cars').update(data).eq('id', carId);
    if (error) return fail(error);
    toast({ title: 'Car updated' });
    await fetchAll(false);
  };

  const addTrips = async (rows: TripInput[]) => {
    if (!rows.length) return true;
    const { error } = await db.from('car_trips').insert(rows.map(r => ({ ...r, car_id: carId, created_by: user?.id })));
    if (error) { fail(error); return false; }
    toast({ title: rows.length > 1 ? `${rows.length} trips added` : 'Trip added' });
    await fetchAll(false);
    return true;
  };

  const updateTrip = async (id: string, data: Partial<TripInput>) => {
    const { error } = await db.from('car_trips').update(data).eq('id', id);
    if (error) return fail(error);
    await fetchAll(false);
  };

  const deleteTrip = async (id: string) => {
    const { error } = await db.from('car_trips').delete().eq('id', id);
    if (error) return fail(error);
    await fetchAll(false);
  };

  const addExpenses = async (rows: ExpenseInput[]) => {
    if (!rows.length) return true;
    const { error } = await db.from('car_expenses').insert(rows.map(r => ({ ...r, car_id: carId, created_by: user?.id })));
    if (error) { fail(error); return false; }
    toast({ title: rows.length > 1 ? `${rows.length} entries added` : 'Entry added' });
    await fetchAll(false);
    return true;
  };

  const updateExpense = async (id: string, data: Partial<ExpenseInput>) => {
    const { error } = await db.from('car_expenses').update(data).eq('id', id);
    if (error) return fail(error);
    await fetchAll(false);
  };

  const deleteExpense = async (id: string) => {
    const { error } = await db.from('car_expenses').delete().eq('id', id);
    if (error) return fail(error);
    await fetchAll(false);
  };

  /**
   * Marks every unpaid trip up to `cutoff` as paid. When the company paid a
   * different amount than the trips total, the gap is saved on `adjustDate`
   * as a deduction expense (paid less) or a bonus entry (paid more).
   */
  const recordPayment = async (p: { cutoff: string; receivedBy: string; diff: number; adjustDate: string; reason?: string }) => {
    const { data, error } = await db.from('car_trips')
      .update({ status: 'received', received_by: p.receivedBy })
      .eq('car_id', carId).eq('status', 'pending').lte('trip_date', p.cutoff)
      .select('id');
    if (error) { fail(error); return false; }

    const diff = Math.round(p.diff);
    const notes = `Company payment up to ${format(parseISO(p.cutoff), 'd MMM yyyy')}${p.reason ? ` – ${p.reason}` : ''}`;
    const adj = diff < 0
      ? await db.from('car_expenses').insert({ car_id: carId, created_by: user?.id, expense_date: p.adjustDate, category: 'deduction', amount: -diff, paid_by: p.receivedBy, notes })
      : diff > 0
        ? await db.from('car_trips').insert({ car_id: carId, created_by: user?.id, trip_date: p.adjustDate, slot: BONUS_SLOT, amount: diff, status: 'received', received_by: p.receivedBy, notes })
        : null;
    if (adj?.error) fail(adj.error);

    toast({ title: 'Payment recorded', description: `${data?.length ?? 0} trips marked as paid` });
    await fetchAll(false);
    return true;
  };

  /**
   * Marks paid trips dated `from`..`to` (from = null: everything up to `to`) as
   * unpaid again, and removes the deduction/bonus saved with those payments.
   */
  const undoPayments = async (from: string | null, to: string) => {
    const start = from ?? '0001-01-01';
    const [paid, bonus, deduction] = await Promise.all([
      db.from('car_trips').update({ status: 'pending', received_by: null })
        .eq('car_id', carId).gte('trip_date', start).lte('trip_date', to).eq('status', 'received').neq('slot', BONUS_SLOT),
      db.from('car_trips').delete()
        .eq('car_id', carId).gte('trip_date', start).lte('trip_date', to).eq('slot', BONUS_SLOT),
      db.from('car_expenses').delete()
        .eq('car_id', carId).gte('expense_date', start).lte('expense_date', to).eq('category', 'deduction'),
    ]);
    const error = paid.error || bonus.error || deduction.error;
    if (error) fail(error);
    else toast({ title: 'Marked as unpaid', description: 'Record the company payment when it arrives.' });
    await fetchAll(false);
  };

  return {
    car, trips, expenses, loading, isOwner, fetchAll,
    updateCar, addTrips, updateTrip, deleteTrip, addExpenses, updateExpense, deleteExpense,
    recordPayment, undoPayments,
  };
}
