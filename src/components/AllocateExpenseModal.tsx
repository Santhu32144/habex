import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Trash2, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnallocatedExpenses } from '@/contexts/UnallocatedExpenseContext';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/data/expenseData';

interface Allocation {
  unallocatedId: string;
  amount: number;
  category: string;
  description: string;
}

interface AllocateExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AllocateExpenseModal: React.FC<AllocateExpenseModalProps> = ({ open, onOpenChange }) => {
  const { unallocatedExpenses, totalUnallocated, markAsAllocated } = useUnallocatedExpenses();
  const { updateMonth, selectedYear, selectedMonth, getYearData } = useExpenses();
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remaining = totalUnallocated - totalAllocated;

  const addAllocation = () => {
    setAllocations((prev) => [
      ...prev,
      {
        unallocatedId: unallocatedExpenses[0]?.id || '',
        amount: 0,
        category: 'snacks',
        description: '',
      },
    ]);
  };

  const updateAllocation = (index: number, field: keyof Allocation, value: any) => {
    setAllocations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAllocate = async () => {
    if (allocations.length === 0 || remaining !== 0) {
      toast({
        title: 'Invalid Allocation',
        description: remaining > 0
          ? `Please allocate all ₹${remaining.toFixed(2)}`
          : 'Please select at least one category',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const yearData = getYearData(selectedYear);
      const monthData = yearData[selectedMonth] || {};

      // Group allocations by category
      const allocationsByCategory: Record<string, Allocation[]> = {};
      allocations.forEach((alloc) => {
        if (!allocationsByCategory[alloc.category]) {
          allocationsByCategory[alloc.category] = [];
        }
        allocationsByCategory[alloc.category].push(alloc);
      });

      // Update expenses for each category
      const updatedMonthData = { ...monthData };
      Object.entries(allocationsByCategory).forEach(([category, items]) => {
        const categoryKey = category as keyof typeof updatedMonthData;
        const categoryData = updatedMonthData[categoryKey];

        items.forEach((item) => {
          if (Array.isArray(categoryData)) {
            if (typeof categoryData[0] === 'number') {
              // Simple number arrays (snacks, food, etc.)
              (categoryData as number[]).push(item.amount);
            } else {
              // Object arrays (otherExpenses, selfExpense)
              (categoryData as Array<{ desc: string; amount: number }>).push({
                desc: item.description || 'Quick Add',
                amount: item.amount,
              });
            }
          }
        });
      });

      // Save to database
      await updateMonth(selectedYear, selectedMonth, updatedMonthData);

      // Mark as allocated
      for (const alloc of allocations) {
        await markAsAllocated(alloc.unallocatedId);
      }

      toast({
        title: 'Success',
        description: `Allocated ₹${totalAllocated}`,
      });

      setAllocations([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error allocating expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to allocate expense',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[min(90vw,500px)] !max-w-none p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💰 Allocate Money
          </DialogTitle>
          <DialogDescription>
            You have ₹{totalUnallocated.toFixed(2)} to allocate across categories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Unallocated History */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">History</Label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {unallocatedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                >
                  <span>₹{expense.amount}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Allocations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Allocations</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addAllocation}
                className="h-7 text-xs"
              >
                + Add Category
              </Button>
            </div>

            <AnimatePresence>
              {allocations.map((allocation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {/* Amount */}
                    <div>
                      <Label htmlFor={`amount-${index}`} className="text-xs">
                        Amount
                      </Label>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        placeholder="0"
                        value={allocation.amount || ''}
                        onChange={(e) =>
                          updateAllocation(index, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="text-sm"
                      />
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <Label htmlFor={`category-${index}`} className="text-xs">
                        Category
                      </Label>
                      <Select
                        value={allocation.category}
                        onValueChange={(value) =>
                          updateAllocation(index, 'category', value)
                        }
                      >
                        <SelectTrigger className="text-sm h-9" id={`category-${index}`}>
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
                  </div>

                  {/* Description (for object-based categories) */}
                  <div>
                    <Label htmlFor={`desc-${index}`} className="text-xs">
                      Description (optional)
                    </Label>
                    <Input
                      id={`desc-${index}`}
                      placeholder="e.g., Zomato, Coffee"
                      value={allocation.description}
                      onChange={(e) =>
                        updateAllocation(index, 'description', e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAllocation(index)}
                    className="w-full text-destructive h-8 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex justify-between text-sm">
              <span>Total Unallocated:</span>
              <span className="font-medium">₹{totalUnallocated.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Allocated:</span>
              <span className="font-medium text-green-600">₹{totalAllocated.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Remaining:</span>
              <span
                className={`font-medium ${
                  remaining === 0 ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                ₹{remaining.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAllocate}
            className="flex-1"
            disabled={isLoading || remaining !== 0 || allocations.length === 0}
          >
            {isLoading ? 'Allocating...' : 'Allocate Money'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
