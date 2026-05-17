-- Create unallocated_expenses table
CREATE TABLE IF NOT EXISTS public.unallocated_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  allocated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unallocated_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own unallocated expenses"
  ON public.unallocated_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unallocated expenses"
  ON public.unallocated_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unallocated expenses"
  ON public.unallocated_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unallocated expenses"
  ON public.unallocated_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_unallocated_expenses_user_id ON public.unallocated_expenses(user_id);
CREATE INDEX idx_unallocated_expenses_allocated ON public.unallocated_expenses(allocated);
