-- Car business tracker: a car attached to a company, owned by partners,
-- with daily trip earnings and expenses (fuel, driver, EMI, ...).
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  reg_number TEXT,
  partners TEXT[] NOT NULL DEFAULT '{}',
  shared_emails TEXT[] NOT NULL DEFAULT '{}',
  monthly_emi NUMERIC NOT NULL DEFAULT 0,
  emi_day INTEGER CHECK (emi_day BETWEEN 1 AND 31),
  driver_name TEXT,
  driver_salary NUMERIC NOT NULL DEFAULT 0,
  default_trip_amount NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  notes TEXT,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.car_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  slot TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'pending')),
  received_by TEXT,
  notes TEXT,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- category: cng | petrol | driver | emi | maintenance | toll | other | transfer
-- 'transfer' is money moved between partners (paid_by -> paid_to); it is not an expense.
CREATE TABLE IF NOT EXISTS public.car_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  paid_by TEXT NOT NULL,
  paid_to TEXT,
  notes TEXT,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS car_trips_car_date_idx ON public.car_trips (car_id, trip_date);
CREATE INDEX IF NOT EXISTS car_expenses_car_date_idx ON public.car_expenses (car_id, expense_date);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_expenses ENABLE ROW LEVEL SECURITY;

-- Owner, or a partner whose login email is in shared_emails
CREATE OR REPLACE FUNCTION public.can_access_car(_car_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cars
    WHERE id = _car_id
      AND (created_by = auth.uid() OR lower(auth.jwt() ->> 'email') = ANY(shared_emails))
  )
$$;

-- cars
DROP POLICY IF EXISTS "Owner or partner can view car" ON public.cars;
CREATE POLICY "Owner or partner can view car" ON public.cars
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR lower(auth.jwt() ->> 'email') = ANY(shared_emails));

DROP POLICY IF EXISTS "Users can create cars" ON public.cars;
CREATE POLICY "Users can create cars" ON public.cars
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Owner or partner can update car" ON public.cars;
CREATE POLICY "Owner or partner can update car" ON public.cars
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR lower(auth.jwt() ->> 'email') = ANY(shared_emails));

DROP POLICY IF EXISTS "Owner can delete car" ON public.cars;
CREATE POLICY "Owner can delete car" ON public.cars
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- car_trips
DROP POLICY IF EXISTS "Car members can view trips" ON public.car_trips;
CREATE POLICY "Car members can view trips" ON public.car_trips
  FOR SELECT TO authenticated USING (public.can_access_car(car_id));
DROP POLICY IF EXISTS "Car members can add trips" ON public.car_trips;
CREATE POLICY "Car members can add trips" ON public.car_trips
  FOR INSERT TO authenticated WITH CHECK (public.can_access_car(car_id));
DROP POLICY IF EXISTS "Car members can update trips" ON public.car_trips;
CREATE POLICY "Car members can update trips" ON public.car_trips
  FOR UPDATE TO authenticated USING (public.can_access_car(car_id));
DROP POLICY IF EXISTS "Car members can delete trips" ON public.car_trips;
CREATE POLICY "Car members can delete trips" ON public.car_trips
  FOR DELETE TO authenticated USING (public.can_access_car(car_id));

-- car_expenses
DROP POLICY IF EXISTS "Car members can view expenses" ON public.car_expenses;
CREATE POLICY "Car members can view expenses" ON public.car_expenses
  FOR SELECT TO authenticated USING (public.can_access_car(car_id));
DROP POLICY IF EXISTS "Car members can add expenses" ON public.car_expenses;
CREATE POLICY "Car members can add expenses" ON public.car_expenses
  FOR INSERT TO authenticated WITH CHECK (public.can_access_car(car_id));
DROP POLICY IF EXISTS "Car members can update expenses" ON public.car_expenses;
CREATE POLICY "Car members can update expenses" ON public.car_expenses
  FOR UPDATE TO authenticated USING (public.can_access_car(car_id));
DROP POLICY IF EXISTS "Car members can delete expenses" ON public.car_expenses;
CREATE POLICY "Car members can delete expenses" ON public.car_expenses
  FOR DELETE TO authenticated USING (public.can_access_car(car_id));

DROP TRIGGER IF EXISTS update_cars_updated_at ON public.cars;
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_car_trips_updated_at ON public.car_trips;
CREATE TRIGGER update_car_trips_updated_at BEFORE UPDATE ON public.car_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_car_expenses_updated_at ON public.car_expenses;
CREATE TRIGGER update_car_expenses_updated_at BEFORE UPDATE ON public.car_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Make the new tables visible to the API immediately
NOTIFY pgrst, 'reload schema';
