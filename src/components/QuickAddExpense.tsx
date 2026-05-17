import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/data/expenseData';

export const QuickAddExpense: React.FC = () => {
  const { updateMonth, selectedYear, selectedMonth, getYearData } = useExpenses();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('snacks');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if description is needed for selected category
  const needsDescription = category === 'otherExpenses' || category === 'selfExpense';

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (needsDescription && !description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please enter a description for this expense',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const numAmount = parseFloat(amount);

      // Get current month data
      const now = new Date();
      const month = now.toLocaleString('default', { month: 'long' });
      const year = now.getFullYear();

      // Get existing month data to merge with new expense
      const yearData = getYearData(year);
      const existingData = yearData[month] || {};

      // Build the complete expense data by merging with existing
      const updatedData = { ...existingData };

      if (category === 'snacks' || category === 'food' || category === 'travellingCharge' || category === 'petrol') {
        updatedData[category] = [...(updatedData[category] || []), numAmount];
      } else if (category === 'otherExpenses' || category === 'selfExpense') {
        updatedData[category] = [...(updatedData[category] || []), { desc: description || 'Quick Add', amount: numAmount }];
      }

      // Update the month data
      await updateMonth(year, month, updatedData);

      toast({
        title: 'Success',
        description: `Added ₹${amount} to ${month}`,
      });
      setAmount('');
      setDescription('');
      setCategory('snacks');
      setOpen(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center hover:scale-110 active:scale-95"
        title="Quick add expense"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Quick Add Expense</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-base"
                autoFocus
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-base">
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

            {/* Description - only shown for otherExpenses and selfExpense */}
            {needsDescription && (
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Input
                  id="description"
                  placeholder="e.g., Zomato, Coffee, Shopping"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-base"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              className="w-full sm:w-auto"
              disabled={isLoading || !amount || (needsDescription && !description.trim())}
            >
              {isLoading ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
