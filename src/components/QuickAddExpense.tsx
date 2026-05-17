import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useUnallocatedExpenses } from '@/contexts/UnallocatedExpenseContext';
import { useToast } from '@/hooks/use-toast';

export const QuickAddExpense: React.FC = () => {
  const { addUnallocatedExpense } = useUnallocatedExpenses();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addUnallocatedExpense(parseFloat(amount));
      toast({
        title: 'Success',
        description: `Added ₹${amount}. You can allocate it later.`,
      });
      setAmount('');
      setOpen(false);
    } catch (error) {
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
        <DialogContent className="!w-[min(90vw,420px)] !max-w-none p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Quick Add Money</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (₹)
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-base"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                You'll allocate this to categories next
              </p>
            </div>
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
              disabled={isLoading || !amount}
            >
              {isLoading ? 'Adding...' : 'Add Amount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
