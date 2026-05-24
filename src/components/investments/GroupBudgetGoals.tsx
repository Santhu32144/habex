import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Target, TrendingDown, AlertCircle } from 'lucide-react';
import type { GroupExpense } from '@/hooks/useInvestmentGroups';

interface BudgetGoal {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'quarterly' | 'total';
  createdAt: string;
}

interface Props {
  expenses: GroupExpense[];
  onAddGoal?: (goal: Omit<BudgetGoal, 'id' | 'spent' | 'createdAt'>) => void;
  onDeleteGoal?: (id: string) => void;
}

export const GroupBudgetGoals: React.FC<Props> = ({ expenses, onAddGoal, onDeleteGoal }) => {
  const [open, setOpen] = useState(false);
  const [budgets, setBudgets] = useState<BudgetGoal[]>([
    { id: '1', category: 'Food', limit: 5000, spent: 0, period: 'monthly', createdAt: new Date().toISOString() },
    { id: '2', category: 'Travel', limit: 10000, spent: 0, period: 'monthly', createdAt: new Date().toISOString() },
  ]);
  const [form, setForm] = useState({ category: '', limit: '', period: 'monthly' as const });

  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const spending: Record<string, number> = {};
    expenses.forEach(e => {
      spending[e.category] = (spending[e.category] || 0) + Number(e.amount);
    });
    return spending;
  }, [expenses]);

  const handleAddGoal = () => {
    if (!form.category || !form.limit) return;

    const newGoal: BudgetGoal = {
      id: Date.now().toString(),
      category: form.category,
      limit: parseFloat(form.limit),
      spent: spendingByCategory[form.category] || 0,
      period: form.period as 'monthly' | 'quarterly' | 'total',
      createdAt: new Date().toISOString(),
    };

    setBudgets([...budgets, newGoal]);
    onAddGoal?.(newGoal);
    setForm({ category: '', limit: '', period: 'monthly' });
    setOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
    onDeleteGoal?.(id);
  };

  // Update spent amounts from expenses
  const goalsWithSpending = budgets.map(goal => ({
    ...goal,
    spent: spendingByCategory[goal.category] || 0,
  }));

  const totalBudget = goalsWithSpending.reduce((sum, g) => sum + g.limit, 0);
  const totalSpent = goalsWithSpending.reduce((sum, g) => sum + g.spent, 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const budgetStatus = budgetUtilization > 100 ? 'over' : budgetUtilization > 80 ? 'warning' : 'healthy';

  const overBudgetGoals = goalsWithSpending.filter(g => g.spent > g.limit);
  const warningGoals = goalsWithSpending.filter(g => g.spent > g.limit * 0.8 && g.spent <= g.limit);

  return (
    <div className="space-y-6">
      {/* Budget Health Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              className={
                budgetStatus === 'over'
                  ? 'bg-red-500/20 text-red-700'
                  : budgetStatus === 'warning'
                  ? 'bg-amber-500/20 text-amber-700'
                  : 'bg-green-500/20 text-green-700'
              }
            >
              {budgetStatus === 'over' ? '🚨 Over Budget' : budgetStatus === 'warning' ? '⚠️ Near Limit' : '✅ On Track'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">{budgetUtilization.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatter.format(totalBudget)}</p>
            <p className="text-xs text-muted-foreground">Across {goalsWithSpending.length} categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatter.format(Math.max(totalBudget - totalSpent, 0))}
            </p>
            {totalBudget - totalSpent < 0 && (
              <p className="text-xs text-red-600">Over by {formatter.format(Math.abs(totalBudget - totalSpent))}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Budget Limits</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Budget Goal</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Category"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                />
                <Input
                  placeholder="Budget Limit"
                  type="number"
                  min="0"
                  value={form.limit}
                  onChange={e => setForm(p => ({ ...p, limit: e.target.value }))}
                />
                <Button onClick={handleAddGoal} className="w-full" disabled={!form.category || !form.limit}>
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {goalsWithSpending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No budget goals yet. Create one to start tracking!</p>
          ) : (
            <div className="space-y-4">
              {goalsWithSpending.map(goal => {
                const percentage = goal.limit > 0 ? (goal.spent / goal.limit) * 100 : 0;
                const isOver = goal.spent > goal.limit;
                const isWarning = goal.spent > goal.limit * 0.8 && !isOver;

                return (
                  <div key={goal.id} className="space-y-2 pb-4 border-b border-border/50 last:border-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{goal.category}</span>
                          {isOver && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Period: {goal.period}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete budget goal?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the {goal.category} budget limit.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteGoal(goal.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-medium">
                          {formatter.format(goal.spent)} / {formatter.format(goal.limit)}
                        </span>
                        <span className={`text-xs font-bold ${isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'}`}>
                          {Math.min(Math.round(percentage), 999)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={`h-2 ${isOver ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-green-100'}`}
                      />
                    </div>

                    {isOver && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Over budget by {formatter.format(goal.spent - goal.limit)}
                      </p>
                    )}
                    {isWarning && (
                      <p className="text-xs text-amber-600">
                        Only {formatter.format(goal.limit - goal.spent)} remaining
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Budget Chart */}
      {goalsWithSpending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {goalsWithSpending
                .sort((a, b) => b.spent - a.spent)
                .map(goal => {
                  const percentage = totalSpent > 0 ? (goal.spent / totalSpent) * 100 : 0;
                  return (
                    <div key={goal.id} className="flex items-center gap-3">
                      <div className="w-20 text-sm font-medium truncate">{goal.category}</div>
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-semibold w-16 text-right">{percentage.toFixed(0)}%</div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GroupBudgetGoals;
