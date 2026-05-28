import React from 'react';
import { motion } from 'framer-motion';
import { useReminders } from '@/contexts/ReminderContext';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const RemindersWidget: React.FC = () => {
  const { getTodayReminders, toggleReminderComplete } = useReminders();
  const navigate = useNavigate();
  const todayReminders = getTodayReminders();

  if (todayReminders.length === 0) {
    return null;
  }

  const pendingReminders = todayReminders.filter((r) => !r.completed);
  const completedReminders = todayReminders.filter((r) => r.completed);

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Today's Reminders</h3>
            <p className="text-xs text-muted-foreground">
              {pendingReminders.length} pending
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reminders')}
          className="gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {/* Pending Reminders */}
        {pendingReminders.slice(0, 3).map((reminder, index) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
            onClick={() => toggleReminderComplete(reminder.id)}
          >
            <div className="flex-shrink-0">
              <div className="w-5 h-5 rounded-md border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center">
                <span className="text-xs">{getPriorityIcon(reminder.priority)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{reminder.title}</p>
              {reminder.time && (
                <p className="text-xs text-muted-foreground">{reminder.time}</p>
              )}
            </div>
          </motion.div>
        ))}

        {/* Completed Reminders (if any) */}
        {completedReminders.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Completed ({completedReminders.length})</p>
            {completedReminders.slice(0, 2).map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-3 p-2 opacity-60"
              >
                <CheckCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground line-through truncate">
                  {reminder.title}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Show more indicator */}
        {todayReminders.length > 3 && (
          <div className="mt-2 text-center">
            <button
              onClick={() => navigate('/reminders')}
              className="text-xs text-primary hover:underline font-medium"
            >
              +{todayReminders.length - 3} more
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RemindersWidget;
