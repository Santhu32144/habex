import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnallocatedExpense {
  id: string;
  amount: number;
  date: string;
  allocated: boolean;
}

interface UnallocatedExpenseContextType {
  unallocatedExpenses: UnallocatedExpense[];
  totalUnallocated: number;
  addUnallocatedExpense: (amount: number) => Promise<void>;
  markAsAllocated: (id: string) => Promise<void>;
  isLoading: boolean;
}

const UnallocatedExpenseContext = createContext<UnallocatedExpenseContextType | undefined>(undefined);

export const UnallocatedExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unallocatedExpenses, setUnallocatedExpenses] = useState<UnallocatedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unallocated expenses
  useEffect(() => {
    if (!user) {
      setUnallocatedExpenses([]);
      setIsLoading(false);
      return;
    }

    const fetchUnallocated = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('unallocated_expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('allocated', false)
          .order('date', { ascending: false });

        if (error) throw error;
        setUnallocatedExpenses(data || []);
      } catch (error) {
        console.error('Error fetching unallocated expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnallocated();
  }, [user]);

  const addUnallocatedExpense = async (amount: number) => {
    if (!user || amount <= 0) return;

    try {
      const { data, error } = await supabase
        .from('unallocated_expenses')
        .insert({
          user_id: user.id,
          amount,
          date: new Date().toISOString(),
          allocated: false,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setUnallocatedExpenses((prev) => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error adding unallocated expense:', error);
      throw error;
    }
  };

  const markAsAllocated = async (id: string) => {
    try {
      const { error } = await supabase
        .from('unallocated_expenses')
        .update({ allocated: true })
        .eq('id', id);

      if (error) throw error;
      setUnallocatedExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error marking as allocated:', error);
      throw error;
    }
  };

  const totalUnallocated = unallocatedExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <UnallocatedExpenseContext.Provider
      value={{
        unallocatedExpenses,
        totalUnallocated,
        addUnallocatedExpense,
        markAsAllocated,
        isLoading,
      }}
    >
      {children}
    </UnallocatedExpenseContext.Provider>
  );
};

export const useUnallocatedExpenses = () => {
  const context = useContext(UnallocatedExpenseContext);
  if (!context) {
    throw new Error('useUnallocatedExpenses must be used within UnallocatedExpenseProvider');
  }
  return context;
};
