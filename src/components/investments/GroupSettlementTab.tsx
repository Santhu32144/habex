import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GroupInvestment, GroupExpense, GroupMember } from '@/hooks/useInvestmentGroups';

interface Props {
  investments: GroupInvestment[];
  expenses: GroupExpense[];
  members: GroupMember[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export const GroupSettlementTab: React.FC<Props> = ({ investments, expenses, members }) => {
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const { settlements, totalBalances } = useMemo(() => {
    // Get all unique people involved
    const people = new Set<string>();
    investments.forEach(i => people.add(i.member_name));
    expenses.forEach(e => people.add(e.spent_by));

    // Calculate how much each person invested
    const invested: Record<string, number> = {};
    people.forEach(p => invested[p] = 0);
    investments.forEach(i => {
      invested[i.member_name] = (invested[i.member_name] || 0) + Number(i.amount);
    });

    // Calculate how much each person spent
    const spent: Record<string, number> = {};
    people.forEach(p => spent[p] = 0);
    expenses.forEach(e => {
      spent[e.spent_by] = (spent[e.spent_by] || 0) + Number(e.amount);
    });

    // Calculate total share per person (equal split)
    const totalInvested = Object.values(invested).reduce((a, b) => a + b, 0);
    const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0);
    const peopleCount = people.size || 1;
    const sharePerPerson = totalSpent / peopleCount;

    // Calculate how much each person owes/is owed
    const balances: Record<string, number> = {};
    people.forEach(p => {
      const invested_amount = invested[p] || 0;
      const spent_amount = spent[p] || 0;
      const share = sharePerPerson;
      balances[p] = invested_amount - share;
    });

    // Generate settlements (simple algorithm)
    const settlements: Settlement[] = [];
    const creditors = Object.entries(balances)
      .filter(([_, bal]) => bal > 0.01)
      .sort((a, b) => b[1] - a[1]);

    const debtors = Object.entries(balances)
      .filter(([_, bal]) => bal < -0.01)
      .sort((a, b) => a[1] - b[1]);

    let creditorIdx = 0;
    let debtorIdx = 0;

    while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
      const [creditor, creditorBalance] = creditors[creditorIdx];
      const [debtor, debtorBalance] = debtors[debtorIdx];

      const amount = Math.min(creditorBalance, -debtorBalance);

      if (amount > 0.01) {
        settlements.push({
          from: debtor,
          to: creditor,
          amount: Math.round(amount * 100) / 100,
        });
      }

      creditors[creditorIdx][1] -= amount;
      debtors[debtorIdx][1] += amount;

      if (creditors[creditorIdx][1] < 0.01) creditorIdx++;
      if (debtors[debtorIdx][1] > -0.01) debtorIdx++;
    }

    return { settlements, totalBalances: balances };
  }, [investments, expenses]);

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgSharePerPerson = totalSpent / (new Set([...investments.map(i => i.member_name), ...expenses.map(e => e.spent_by)]).size || 1);

  if (investments.length === 0 && expenses.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">No investments or expenses yet. Settlements will appear once you add some.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatter.format(totalInvested)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatter.format(totalSpent)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Per Person Share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatter.format(avgSharePerPerson)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settlement Required</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Everyone is settled! No payments needed.</p>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-semibold">{settlement.from}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{settlement.to}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{formatter.format(settlement.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Individual Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Share</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(totalBalances).map(([person, balance]) => {
                const personInvested = investments
                  .filter(i => i.member_name === person)
                  .reduce((sum, i) => sum + Number(i.amount), 0);

                const personSpent = expenses
                  .filter(e => e.spent_by === person)
                  .reduce((sum, e) => sum + Number(e.amount), 0);

                const share = (total => total / (new Set([...investments.map(i => i.member_name), ...expenses.map(e => e.spent_by)]).size || 1))(totalSpent);

                return (
                  <TableRow key={person}>
                    <TableCell className="font-semibold">{person}</TableCell>
                    <TableCell className="text-right">{formatter.format(personInvested)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatter.format(share)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {balance >= 0 ? '+' : ''}{formatter.format(balance)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">
            <strong>Positive balance:</strong> They should receive money back | <strong>Negative balance:</strong> They should pay money
          </p>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            const csv = [
              ['Settlement Required'],
              ['From', 'To', 'Amount'],
              ...settlements.map(s => [s.from, s.to, s.amount.toString()]),
              [],
              ['Individual Balances'],
              ['Person', 'Invested', 'Share', 'Balance'],
              ...Object.entries(totalBalances).map(([person, balance]) => {
                const personInvested = investments.filter(i => i.member_name === person).reduce((sum, i) => sum + Number(i.amount), 0);
                const share = totalSpent / (new Set([...investments.map(i => i.member_name), ...expenses.map(e => e.spent_by)]).size || 1);
                return [person, personInvested.toString(), share.toString(), balance.toString()];
              })
            ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'settlement.csv';
            a.click();
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Settlement
        </Button>
      </div>
    </div>
  );
};

export default GroupSettlementTab;
