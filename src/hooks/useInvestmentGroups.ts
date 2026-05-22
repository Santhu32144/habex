import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface InvestmentGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  email: string;
  permissions: string[];
  status: string;
  invited_by: string;
  created_at: string;
}

export interface GroupInvestment {
  id: string;
  group_id: string;
  member_name: string;
  member_email: string | null;
  amount: number;
  description: string | null;
  invested_date: string;
  added_by: string;
  created_at: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  amount: number;
  category: string;
  spent_by: string;
  description: string | null;
  receipt_url: string | null;
  expense_date: string;
  added_by: string;
  created_at: string;
}

export function useInvestmentGroups() {
  const [groups, setGroups] = useState<InvestmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investment_groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        // Better error messaging
        const errorMsg = error.message.includes('investment_groups')
          ? 'Investment groups feature is not yet set up. Please contact support.'
          : error.message;
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
      } else {
        setGroups((data as any[]) || []);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load investment groups', variant: 'destructive' });
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = async (name: string, description: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('investment_groups')
      .insert({ name, description, created_by: user.id } as any)
      .select()
      .maybeSingle();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    toast({ title: 'Group created!', description: `"${name}" has been created successfully.` });
    await fetchGroups();
    return data;
  };

  const deleteGroup = async (id: string) => {
    const { error } = await supabase.from('investment_groups').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchGroups();
    }
  };

  return { groups, loading, fetchGroups, createGroup, deleteGroup };
}

export function useGroupDetails(groupId: string | undefined) {
  const [group, setGroup] = useState<InvestmentGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [investments, setInvestments] = useState<GroupInvestment[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    if (!groupId || !user) return;
    setLoading(true);
    const [gRes, mRes, iRes, eRes] = await Promise.all([
      supabase.from('investment_groups').select('*').eq('id', groupId).single(),
      supabase.from('group_members').select('*').eq('group_id', groupId).order('created_at'),
      supabase.from('group_investments').select('*').eq('group_id', groupId).order('invested_date', { ascending: false }),
      supabase.from('group_expenses').select('*').eq('group_id', groupId).order('expense_date', { ascending: false }),
    ]);
    if (gRes.error) {
      toast({ title: 'Error', description: gRes.error.message, variant: 'destructive' });
    } else {
      setGroup(gRes.data as any);
    }
    setMembers((mRes.data as any[]) || []);
    setInvestments((iRes.data as any[]) || []);
    setExpenses((eRes.data as any[]) || []);
    setLoading(false);
  }, [groupId, user, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const isCreator = user?.id === group?.created_by;

  const addMember = async (email: string, permissions: string[]) => {
    if (!groupId || !user) return;
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId, email, permissions, invited_by: user.id, status: 'active'
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member invited' });
      await fetchAll();
    }
  };

  const updateMemberPermissions = async (memberId: string, permissions: string[]) => {
    const { error } = await supabase.from('group_members').update({ permissions } as any).eq('id', memberId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchAll();
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('group_members').update({ status: 'removed' } as any).eq('id', memberId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member removed' });
      await fetchAll();
    }
  };

  const addInvestment = async (data: { member_name: string; member_email?: string; amount: number; description?: string; invested_date: string }) => {
    if (!groupId || !user) return;
    const { error } = await supabase.from('group_investments').insert({
      group_id: groupId, ...data, added_by: user.id
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Investment added' });
      await fetchAll();
    }
  };

  const addExpense = async (data: { amount: number; category: string; spent_by: string; description?: string; expense_date: string; receipt_url?: string }) => {
    if (!groupId || !user) return;
    const { error } = await supabase.from('group_expenses').insert({
      group_id: groupId, ...data, added_by: user.id
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Expense added' });
      await fetchAll();
    }
  };

  const updateInvestment = async (id: string, data: { amount?: number; description?: string; invested_date?: string; member_name?: string }) => {
    const { error } = await supabase.from('group_investments').update(data as any).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Investment updated' });
      await fetchAll();
    }
  };

  const updateGroup = async (data: { name?: string; description?: string }) => {
    if (!groupId) return;
    const { error } = await supabase.from('investment_groups').update(data as any).eq('id', groupId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Group updated' });
      await fetchAll();
    }
  };

  const deleteInvestment = async (id: string) => {
    const { error } = await supabase.from('group_investments').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await fetchAll();
  };

  const updateExpense = async (id: string, data: { amount?: number; category?: string; spent_by?: string; description?: string; expense_date?: string }) => {
    const { error } = await supabase.from('group_expenses').update(data as any).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Expense updated' });
      await fetchAll();
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('group_expenses').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await fetchAll();
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${groupId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('receipts').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    }
    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0);
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalInvested - totalSpent;

  return {
    group, members, investments, expenses, loading, isCreator,
    totalInvested, totalSpent, balance,
    addMember, updateMemberPermissions, removeMember,
    addInvestment, updateInvestment, updateGroup, addExpense, updateExpense, deleteInvestment, deleteExpense,
    uploadReceipt, fetchAll,
  };
}
