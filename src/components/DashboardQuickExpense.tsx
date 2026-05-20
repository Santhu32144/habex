import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export const DashboardQuickExpense: React.FC = () => {
  const { updateMonth, getYearData } = useExpenses();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('snacks');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        description: 'Please enter a description',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const numAmount = parseFloat(amount);
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
        title: 'Success!',
        description: `Added ₹${amount} to ${month}`,
      });

      setAmount('');
      setDescription('');
      setCategory('snacks');
      setIsExpanded(false);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className={`border-dashed transition-all ${isExpanded ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <div>
                <CardTitle className="text-lg">Quick Add</CardTitle>
                <CardDescription>Add today's expenses instantly</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {!isExpanded ? (
            <Button
              onClick={() => setIsExpanded(true)}
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          ) : (
            <>
              <div className="space-y-3">
                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    className="text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="text-sm">
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

                {/* Description - only for otherExpenses and selfExpense */}
                {needsDescription && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Description *
                    </label>
                    <Input
                      placeholder="e.g., Zomato, Coffee"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setIsExpanded(false)}
                  variant="ghost"
                  className="flex-1 text-sm"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  className="flex-1 gap-2 text-sm"
                  disabled={isLoading || !amount || (needsDescription && !description.trim())}
                >
                  <Send className="w-3 h-3" />
                  {isLoading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
