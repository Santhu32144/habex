import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/data/expenseData';
import {
  Plus,
  DollarSign,
  Heart,
  BookOpen,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const QuickActionsButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'snacks', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateMonth, getYearData } = useExpenses();
  const { toast } = useToast();

  const handleAddExpense = async () => {
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast({ description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    // Validate description for self expense and other expenses
    if ((expenseForm.category === 'selfExpense' || expenseForm.category === 'otherExpenses') && !expenseForm.description.trim()) {
      toast({ description: 'Please enter a description', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const month = now.toLocaleString('default', { month: 'long' });
      const year = now.getFullYear();
      const numAmount = parseFloat(expenseForm.amount);

      // Get existing month data
      const yearData = getYearData(year);
      const existingData = yearData[month] || {};
      const updatedData = { ...existingData };

      // Add the expense
      const categoryKey = expenseForm.category as keyof typeof CATEGORIES;

      if (expenseForm.category === 'selfExpense' || expenseForm.category === 'otherExpenses') {
        // For self expense and other expenses, add as object with description
        updatedData[categoryKey] = [...(updatedData[categoryKey] || []), { desc: expenseForm.description, amount: numAmount }];
      } else {
        // For other categories, add just the number
        updatedData[categoryKey] = [...(updatedData[categoryKey] || []), numAmount];
      }

      // Update the month
      await updateMonth(year, month, updatedData);

      toast({ description: `Added ₹${expenseForm.amount}!` });
      setExpenseForm({ amount: '', category: 'snacks', description: '' });
      setShowExpenseDialog(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({ description: 'Failed to add expense', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const actions = [
    {
      icon: BookOpen,
      label: 'Add Note',
      action: () => {
        navigate('/notebook');
        setIsOpen(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Heart,
      label: 'Log Habit',
      action: () => {
        navigate('/habits');
        setIsOpen(false);
      },
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      icon: DollarSign,
      label: 'Add Expense',
      action: () => {
        setShowExpenseDialog(true);
      },
      color: 'bg-green-500 hover:bg-green-600',
    },
  ];

  return (
    <>
      {/* Quick Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="w-96">
          <DialogHeader>
            <DialogTitle>Quick Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                placeholder="Enter amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                className="mt-1"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(expenseForm.category === 'selfExpense' || expenseForm.category === 'otherExpenses') && (
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Why are you spending this amount?"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowExpenseDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddExpense}
                className="bg-green-500 hover:bg-green-600"
                disabled={isLoading || !expenseForm.amount}
              >
                {isLoading ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-24 right-4 z-50 sm:bottom-28 sm:right-6 flex flex-col items-end gap-3 pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-3 items-end"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    delay: index * 0.08,
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-medium text-muted-foreground bg-background/80 px-3 py-2 rounded-lg whitespace-nowrap shadow-md border border-border/50">
                    {action.label}
                  </span>
                  <button
                    onClick={action.action}
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-95 border border-white/20 flex-shrink-0',
                      action.color
                    )}
                    title={action.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white font-semibold transition-all hover:scale-110 active:scale-95 border-2 border-white/20',
          isOpen
            ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/50'
            : 'bg-gradient-to-br from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 shadow-cyan-400/50'
        )}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        title={isOpen ? 'Close menu' : 'Quick actions'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-7 h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-7 h-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
    </>
  );
};

export default QuickActionsButton;
