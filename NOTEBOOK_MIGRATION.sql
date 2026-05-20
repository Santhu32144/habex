-- Create notes table for Notebook feature
CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'bg-card',
  pinned BOOLEAN DEFAULT FALSE,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own notes
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can insert their own notes
CREATE POLICY "Users can insert their own notes" ON public.notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can update their own notes
CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can delete their own notes
CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE
  USING (auth.uid() = user_id);
