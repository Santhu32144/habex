import React, { useState, useMemo, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useRecurringExpenses } from '@/contexts/RecurringExpenseContext';
import { CATEGORIES, MONTHS } from '@/data/expenseData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'budget' | 'recurring';
  title: string;
  message: string;
  icon: string;
  severity: 'warning' | 'info';
}

export const NotificationBell: React.FC = () => {
  const { expenses, selectedYear, budgets } = useExpenses();
  const { getActiveRecurringExpenses, getMonthlyTotal } = useRecurringExpenses();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('dismissedNotifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('dismissedNotifications', JSON.stringify(Array.from(dismissedNotifications)));
  }, [dismissedNotifications]);

  const notifications = useMemo(() => {
    const alerts: Notification[] = [];
    const currentMonth = MONTHS[new Date().getMonth()];
    const yearData = expenses[selectedYear];
    const yearBudgets = budgets[selectedYear] || {};

    // Check budget overruns for current month
    if (yearData && yearData[currentMonth]) {
      const monthData = yearData[currentMonth];
      
      Object.entries(CATEGORIES).forEach(([key, category]) => {
        const budget = yearBudgets[key];
        if (!budget) return;

        let spent = 0;
        const data = monthData[key as keyof typeof monthData];
        
        if (Array.isArray(data)) {
          if (typeof data[0] === 'number') {
            spent = (data as number[]).reduce((a, b) => a + b, 0);
          } else {
            spent = (data as { amount: number }[]).reduce((a, b) => a + b.amount, 0);
          }
        }

        const percentage = (spent / budget) * 100;
        
        if (percentage >= 100) {
          alerts.push({
            id: `budget-${key}`,
            type: 'budget',
            title: `${category.label} Budget Exceeded`,
            message: `You've spent ₹${spent.toLocaleString()} of ₹${budget.toLocaleString()} (${Math.round(percentage)}%)`,
            icon: category.icon,
            severity: 'warning',
          });
        } else if (percentage >= 80) {
          alerts.push({
            id: `budget-${key}-warning`,
            type: 'budget',
            title: `${category.label} Budget Alert`,
            message: `You've used ${Math.round(percentage)}% of your budget`,
            icon: category.icon,
            severity: 'info',
          });
        }
      });
    }

    // Check upcoming recurring expenses
    const activeRecurring = getActiveRecurringExpenses();
    const monthlyTotal = getMonthlyTotal();
    
    if (monthlyTotal > 0) {
      alerts.push({
        id: 'recurring-total',
        type: 'recurring',
        title: 'Monthly Subscriptions',
        message: `₹${Math.round(monthlyTotal).toLocaleString()} due this month`,
        icon: '📅',
        severity: 'info',
      });
    }

    // Add individual high-value recurring expenses
    activeRecurring
      .filter(e => e.amount >= 1000)
      .slice(0, 3)
      .forEach(expense => {
        alerts.push({
          id: `recurring-${expense.id}`,
          type: 'recurring',
          title: expense.name,
          message: `₹${expense.amount.toLocaleString()} - ${expense.frequency}`,
          icon: expense.icon || '💳',
          severity: 'info',
        });
      });

    return alerts;
  }, [expenses, selectedYear, budgets, getActiveRecurringExpenses, getMonthlyTotal]);

  const visibleNotifications = notifications.filter(n => !dismissedNotifications.has(n.id));
  const warningCount = visibleNotifications.filter(n => n.severity === 'warning').length;
  const hasNotifications = visibleNotifications.length > 0;

  const dismissNotification = (notificationId: string) => {
    setDismissedNotifications(prev => new Set(prev).add(notificationId));
  };

  const clearAllNotifications = () => {
    setDismissedNotifications(new Set(notifications.map(n => n.id)));
  };

  const handleNotificationClick = (notification: Notification) => {
    setOpen(false);
    if (notification.type === 'budget') {
      navigate('/');
    } else {
      navigate('/recurring');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-primary/10"
        >
          <Bell className="w-5 h-5" />
          {hasNotifications && (
            <span 
              className={cn(
                "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                warningCount > 0 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-primary text-primary-foreground"
              )}
            >
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover border border-border shadow-lg">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {warningCount > 0 && (
            <span className="text-xs text-destructive font-normal">
              {warningCount} alert{warningCount > 1 ? 's' : ''}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleNotifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors group",
                    notification.severity === 'warning' && "bg-destructive/5 hover:bg-destructive/10"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="text-lg flex-shrink-0">{notification.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      notification.severity === 'warning' && "text-destructive"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.message}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
            {visibleNotifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllNotifications();
                    }}
                  >
                    Clear all notifications
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
