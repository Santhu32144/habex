import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Zap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GroupInvestment, GroupExpense, GroupMember } from '@/hooks/useInvestmentGroups';

interface Props {
  investments: GroupInvestment[];
  expenses: GroupExpense[];
  members: GroupMember[];
}

interface MemberMetric {
  name: string;
  totalInvested: number;
  totalSpent: number;
  percentageOfTotal: number;
  contributionScore: number;
  transactions: number;
  trend: 'up' | 'down' | 'neutral';
}

export const GroupMemberMetrics: React.FC<Props> = ({ investments, expenses, members }) => {
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const metrics = useMemo(() => {
    // Get all unique members from investments and expenses
    const people = new Set<string>();
    investments.forEach(i => people.add(i.member_name));
    expenses.forEach(e => people.add(e.spent_by));

    const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);

    const memberMetrics: MemberMetric[] = Array.from(people).map(name => {
      const personInvested = investments
        .filter(i => i.member_name === name)
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const personSpent = expenses
        .filter(e => e.spent_by === name)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const personTransactions = investments.filter(i => i.member_name === name).length +
                                 expenses.filter(e => e.spent_by === name).length;

      // Calculate contribution score (higher is better)
      // Score = (Investment / Total * 100) + Activity bonus
      const investmentScore = totalInvested > 0 ? (personInvested / totalInvested) * 100 : 0;
      const activityBonus = Math.min(personTransactions * 2, 20); // Max 20 points for activity
      const contributionScore = Math.min(investmentScore + activityBonus, 100);

      // Determine trend (if person has spent more than invested recently)
      const recentExpenses = expenses
        .filter(e => e.spent_by === name)
        .slice(0, 3)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const trend = recentExpenses > personSpent / 3 ? 'up' : personSpent === 0 ? 'neutral' : 'down';

      return {
        name,
        totalInvested: personInvested,
        totalSpent: personSpent,
        percentageOfTotal: totalInvested > 0 ? (personInvested / totalInvested) * 100 : 0,
        contributionScore,
        transactions: personTransactions,
        trend,
      };
    }).sort((a, b) => b.contributionScore - a.contributionScore);

    return memberMetrics;
  }, [investments, expenses]);

  const topContributor = metrics[0];
  const avgContribution = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.contributionScore, 0) / metrics.length
    : 0;

  if (metrics.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No members yet. Add investments or expenses to see metrics.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Contributors Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Contributor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{topContributor?.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatter.format(topContributor?.totalInvested || 0)} invested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{metrics.length}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.filter(m => m.transactions > 0).length} with transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{avgContribution.toFixed(0)}/100</p>
            <p className="text-xs text-muted-foreground">
              Group contribution health
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Member Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={metric.name} className="space-y-2 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{index + 1}. {metric.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          metric.trend === 'up'
                            ? 'border-green-500/30 bg-green-500/10 text-green-700'
                            : metric.trend === 'down'
                            ? 'border-red-500/30 bg-red-500/10 text-red-700'
                            : 'border-gray-500/30 bg-gray-500/10 text-gray-700'
                        }
                      >
                        {metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {metric.transactions} transaction{metric.transactions !== 1 ? 's' : ''} • {metric.percentageOfTotal.toFixed(1)}% of total
                    </p>
                  </div>
                  <span className="text-right">
                    <p className="font-bold text-green-600">{formatter.format(metric.totalInvested)}</p>
                    {metric.totalSpent > 0 && (
                      <p className="text-xs text-red-600">{formatter.format(metric.totalSpent)} spent</p>
                    )}
                  </span>
                </div>

                {/* Contribution Score Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Contribution Score</span>
                    <span className="text-sm font-bold">{metric.contributionScore.toFixed(0)}/100</span>
                  </div>
                  <Progress value={metric.contributionScore} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score Legend */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6 text-sm space-y-2">
          <div className="font-semibold mb-3">📊 Score Breakdown</div>
          <div className="space-y-2 text-muted-foreground text-xs">
            <p>• <strong>Investment Score</strong>: Percentage of total invested (0-100)</p>
            <p>• <strong>Activity Bonus</strong>: Extra points for contributions (+20 max)</p>
            <p>• <strong>Trend</strong>: 📈 Increasing spending, 📉 Decreasing, ➡️ Stable</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupMemberMetrics;
