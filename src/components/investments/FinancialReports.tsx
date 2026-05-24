import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { GroupInvestment, GroupExpense } from '@/hooks/useInvestmentGroups';

interface Props {
  investments: GroupInvestment[];
  expenses: GroupExpense[];
  groupName: string;
}

export const FinancialReports: React.FC<Props> = ({ investments, expenses, groupName }) => {
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const reports = useMemo(() => {
    // Group by category for expenses
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount);
    });

    // Timeline data (by month)
    const timelineData: Record<string, { invested: number; spent: number; date: string }> = {};
    investments.forEach(i => {
      const month = i.invested_date.substring(0, 7); // YYYY-MM
      if (!timelineData[month]) timelineData[month] = { invested: 0, spent: 0, date: month };
      timelineData[month].invested += Number(i.amount);
    });
    expenses.forEach(e => {
      const month = e.expense_date.substring(0, 7);
      if (!timelineData[month]) timelineData[month] = { invested: 0, spent: 0, date: month };
      timelineData[month].spent += Number(e.amount);
    });

    const timelineArray = Object.values(timelineData)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        month: new Date(d.date + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      }));

    // Top expenses
    const topExpenses = expenses
      .map(e => ({ category: e.category, amount: Number(e.amount), date: e.expense_date }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Financial summary
    const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const balance = totalInvested - totalSpent;
    const avgInvestment = investments.length > 0 ? totalInvested / investments.length : 0;
    const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;
    const investmentTrend = investments.length > 0 ? ((investments[investments.length - 1]?.amount || 0) - (investments[0]?.amount || 0)) / (investments[0]?.amount || 1) : 0;

    return {
      expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({ name, value })),
      timelineArray,
      topExpenses,
      summary: {
        totalInvested,
        totalSpent,
        balance,
        avgInvestment,
        avgExpense,
        investmentTrend,
        investmentCount: investments.length,
        expenseCount: expenses.length,
      },
    };
  }, [investments, expenses]);

  const generatePDFReport = () => {
    // Create a CSV version for PDF-like export
    const lines = [
      `FINANCIAL REPORT - ${groupName}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'SUMMARY',
      `Total Invested,${reports.summary.totalInvested}`,
      `Total Spent,${reports.summary.totalSpent}`,
      `Balance,${reports.summary.balance}`,
      `Average Investment,${reports.summary.avgInvestment.toFixed(2)}`,
      `Average Expense,${reports.summary.avgExpense.toFixed(2)}`,
      '',
      'EXPENSES BY CATEGORY',
      'Category,Amount',
      ...reports.expensesByCategory.map(e => `${e.name},${e.value}`),
      '',
      'TIMELINE',
      'Month,Invested,Spent',
      ...reports.timelineArray.map(t => `${t.month},${t.invested},${t.spent}`),
    ];

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${groupName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatter.format(reports.summary.totalInvested)}</p>
            <p className="text-xs text-muted-foreground">{reports.summary.investmentCount} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatter.format(reports.summary.totalSpent)}</p>
            <p className="text-xs text-muted-foreground">{reports.summary.expenseCount} expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${reports.summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatter.format(reports.summary.balance)}
            </p>
            <p className="text-xs text-muted-foreground">
              {reports.summary.balance >= 0 ? 'Funds remaining' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatter.format(reports.summary.avgInvestment)}</p>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatter.format(reports.summary.avgExpense)}</p>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart - Expenses by Category */}
      {reports.expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports.expensesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatter.format(value)} />
                  <Bar dataKey="value" fill="#ef4444" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart - Timeline */}
      {reports.timelineArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investment vs Expenses Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reports.timelineArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatter.format(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="invested"
                    stroke="#10b981"
                    name="Invested"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    stroke="#ef4444"
                    name="Spent"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Expenses Table */}
      {reports.topExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.topExpenses.map((expense, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <div>
                    <Badge variant="outline">{expense.category}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-red-600">{formatter.format(expense.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={generatePDFReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
};

export default FinancialReports;
