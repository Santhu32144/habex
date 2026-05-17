import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  CreditCard,
  Home,
  Music,
  Tv,
  Wifi,
  Phone,
  Car,
  Zap,
  Droplets,
  Shield,
  Heart,
  X,
  Check,
} from 'lucide-react';
import { useRecurringExpenses, RecurringExpense, RecurrenceFrequency } from '@/contexts/RecurringExpenseContext';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const EXPENSE_ICONS = [
  { icon: '🏠', label: 'Rent' },
  { icon: '🎵', label: 'Music' },
  { icon: '📺', label: 'Streaming' },
  { icon: '📱', label: 'Phone' },
  { icon: '🌐', label: 'Internet' },
  { icon: '⚡', label: 'Electricity' },
  { icon: '💧', label: 'Water' },
  { icon: '🚗', label: 'Car' },
  { icon: '🛡️', label: 'Insurance' },
  { icon: '💪', label: 'Gym' },
  { icon: '💳', label: 'Subscription' },
  { icon: '📦', label: 'Other' },
];

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const RecurringExpenses: React.FC = () => {
  const {
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    getMonthlyTotal,
  } = useRecurringExpenses();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<RecurringExpense | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'selfExpense' as 'otherExpenses' | 'selfExpense',
    frequency: 'monthly' as RecurrenceFrequency,
    startDate: new Date().toISOString().split('T')[0],
    icon: '📦',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'selfExpense',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      icon: '📦',
      notes: '',
    });
    setEditingExpense(null);
  };

  const handleOpenDialog = (expense?: RecurringExpense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        name: expense.name,
        amount: expense.amount.toString(),
        category: expense.category,
        frequency: expense.frequency,
        startDate: expense.startDate,
        icon: expense.icon || '📦',
        notes: expense.notes || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const expenseData = {
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      frequency: formData.frequency,
      startDate: formData.startDate,
      icon: formData.icon,
      notes: formData.notes,
      isActive: true,
    };

    if (editingExpense) {
      updateRecurringExpense(editingExpense.id, expenseData);
      toast({
        title: 'Updated!',
        description: `${formData.name} has been updated.`,
      });
    } else {
      addRecurringExpense(expenseData);
      toast({
        title: 'Added!',
        description: `${formData.name} has been added to recurring expenses.`,
      });
    }

    handleCloseDialog();
  };

  const handleDeleteClick = (expense: RecurringExpense) => {
    setExpenseToDelete(expense);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      deleteRecurringExpense(expenseToDelete.id);
      toast({
        title: 'Deleted',
        description: `${expenseToDelete.name} has been removed.`,
      });
      setExpenseToDelete(null);
    }
  };

  const activeExpenses = recurringExpenses.filter(e => e.isActive);
  const inactiveExpenses = recurringExpenses.filter(e => !e.isActive);
  const monthlyTotal = getMonthlyTotal();
  const yearlyTotal = monthlyTotal * 12;

  const getFrequencyBadgeColor = (frequency: RecurrenceFrequency) => {
    switch (frequency) {
      case 'weekly':
        return 'bg-blue-500/20 text-blue-500';
      case 'monthly':
        return 'bg-green-500/20 text-green-500';
      case 'quarterly':
        return 'bg-orange-500/20 text-orange-500';
      case 'yearly':
        return 'bg-purple-500/20 text-purple-500';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-primary" />
            Recurring Expenses
          </h1>
          <p className="text-muted-foreground">
            Manage your subscriptions and recurring bills
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                ₹{monthlyTotal.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yearly Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ₹{yearlyTotal.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeExpenses.length}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Active Expenses */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          Active ({activeExpenses.length})
        </h2>
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {activeExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{expense.icon || '📦'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{expense.name}</h3>
                          <Badge className={cn('text-xs', getFrequencyBadgeColor(expense.frequency))}>
                            {expense.frequency}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {expense.category === 'selfExpense' ? 'Self Expense' : 'Other Expense'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ₹{expense.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          per {expense.frequency.replace('ly', '')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={expense.isActive}
                          onCheckedChange={() => toggleRecurringExpense(expense.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(expense)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(expense)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {activeExpenses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No active recurring expenses. Click "Add Expense" to get started.
            </p>
          )}
        </div>
      </div>

      {/* Inactive Expenses */}
      {inactiveExpenses.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2 text-muted-foreground">
            <X className="w-5 h-5" />
            Inactive ({inactiveExpenses.length})
          </h2>
          <div className="grid gap-3 opacity-60">
            {inactiveExpenses.map((expense) => (
              <Card key={expense.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl grayscale">{expense.icon || '📦'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{expense.name}</h3>
                      <p className="text-sm text-muted-foreground">Paused</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{expense.amount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={expense.isActive}
                        onCheckedChange={() => toggleRecurringExpense(expense.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(expense)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="!w-[min(92vw,440px)] !max-w-none p-4 sm:p-6 !max-h-[calc(100vh-3rem)] !top-[50%] !-translate-y-1/2 overflow-y-auto gap-3 sm:gap-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {editingExpense ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            {/* Icon Selection */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_ICONS.map(({ icon, label }) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={cn(
                      'p-2 rounded-lg text-xl transition-all hover:scale-110',
                      formData.icon === icon
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                    title={label}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Netflix, Rent, Gym"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs sm:text-sm font-medium">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="text-base"
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: RecurrenceFrequency) =>
                  setFormData(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'otherExpenses' | 'selfExpense') =>
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selfExpense">Self Expense</SelectItem>
                  <SelectItem value="otherExpenses">Other Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs sm:text-sm font-medium">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="text-base"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">Notes (optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                className="text-base"
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              {editingExpense ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{expenseToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecurringExpenses;
