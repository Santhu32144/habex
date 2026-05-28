import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { useReminders, Reminder } from '@/contexts/ReminderContext';
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
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Reminders: React.FC = () => {
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminderComplete } = useReminders();
  const [isAddReminderDialogOpen, setIsAddReminderDialogOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'today' | 'upcoming' | 'all'>('today');
  const [selectedDateOnCalendar, setSelectedDateOnCalendar] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<Omit<Reminder, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    completed: false,
    priority: 'medium',
  });
  const { toast } = useToast();

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const today = getTodayDate();
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getFilteredReminders = () => {
    switch (filterTab) {
      case 'today':
        return reminders.filter((r) => r.date === today);
      case 'upcoming':
        return reminders.filter((r) => r.date > today);
      case 'all':
      default:
        return reminders;
    }
  };

  // Calendar data generation
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const days: { date: number; dateStr: string; count: number; priority: string; isFuture: boolean; isEmpty: boolean }[] = [];

    // Empty slots before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ date: 0, dateStr: '', count: 0, priority: '', isFuture: false, isEmpty: true });
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayReminders = reminders.filter((r) => r.date === dateStr);
      const highPriority = dayReminders.some((r) => r.priority === 'high');
      const mediumPriority = dayReminders.some((r) => r.priority === 'medium');
      const isFuture = day > currentDay && currentYear === currentDate.getFullYear() && currentMonth === currentDate.getMonth();

      days.push({
        date: day,
        dateStr,
        count: dayReminders.length,
        priority: highPriority ? 'high' : mediumPriority ? 'medium' : 'low',
        isFuture,
        isEmpty: false,
      });
    }

    return days;
  }, [reminders, currentMonth, currentYear, currentDay, currentDate]);

  const handleOpenDialog = (reminder?: Reminder, dateStr?: string) => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        description: reminder.description,
        date: reminder.date,
        time: reminder.time || '',
        completed: reminder.completed,
        priority: reminder.priority,
      });
      setEditingId(reminder.id);
    } else {
      const initialDate = dateStr || today;
      setFormData({
        title: '',
        description: '',
        date: initialDate,
        time: '',
        completed: false,
        priority: 'medium',
      });
      setEditingId(null);
    }
    setIsAddReminderDialogOpen(true);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateOnCalendar(dateStr);
    setEditingId(null);
    setIsDateModalOpen(true);
  };

  const getCalendarReminders = (dateStr: string) => {
    return reminders.filter((r) => r.date === dateStr);
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 dark:bg-red-600';
      case 'medium':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'low':
        return 'bg-green-500 dark:bg-green-600';
      default:
        return 'bg-muted';
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ description: 'Please enter a title', variant: 'destructive' });
      return;
    }

    if (editingId) {
      updateReminder(editingId, formData);
      toast({ description: 'Reminder updated!' });
    } else {
      addReminder(formData);
      toast({ description: 'Reminder added!' });
    }

    setIsAddReminderDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      date: today,
      time: '',
      completed: false,
      priority: 'medium',
    });
    setEditingId(null);
  };

  const filteredReminders = getFilteredReminders();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Reminders & Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and important dates with calendar view</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card p-6"
      >
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">{monthNames[currentMonth]} {currentYear}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayLabels.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((dayData, index) => (
              <div key={index}>
                {dayData.isEmpty ? (
                  <div className="aspect-square" />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSelectDate(dayData.dateStr)}
                        className={cn(
                          'w-full aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all border cursor-pointer',
                          dayData.count === 0
                            ? 'bg-muted/30 border-border hover:bg-muted/50'
                            : dayData.priority === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:shadow-md'
                            : dayData.priority === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:shadow-md'
                            : 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:shadow-md'
                        )}
                      >
                        <div className="font-semibold">{dayData.date}</div>
                        {dayData.count > 0 && (
                          <div className="text-xs mt-1 px-1.5 py-0.5 rounded bg-foreground/10">
                            {dayData.count} {dayData.count === 1 ? 'task' : 'tasks'}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {dayData.count > 0 && (
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          {getCalendarReminders(dayData.dateStr)
                            .slice(0, 3)
                            .map((reminder) => (
                              <div key={reminder.id} className="text-xs">
                                <span className={cn('inline-block w-2 h-2 rounded-full mr-1', getPriorityBgColor(reminder.priority))} />
                                {reminder.title}
                              </div>
                            ))}
                          {dayData.count > 3 && (
                            <div className="text-xs text-muted-foreground">+{dayData.count - 3} more</div>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-sm text-muted-foreground">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-sm text-muted-foreground">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-sm text-muted-foreground">Low Priority</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Date Details Modal */}
      <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedDateOnCalendar &&
                new Date(selectedDateOnCalendar + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDateOnCalendar && getCalendarReminders(selectedDateOnCalendar).length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No tasks for this date</p>
                <Button onClick={() => handleOpenDialog(undefined, selectedDateOnCalendar)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateOnCalendar &&
                  getCalendarReminders(selectedDateOnCalendar).map((reminder, index) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'p-4 rounded-lg border transition-all',
                        reminder.completed
                          ? 'bg-muted/50 border-border opacity-60'
                          : 'bg-card border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleReminderComplete(reminder.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          <div
                            className={cn(
                              'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
                              reminder.completed
                                ? 'bg-primary border-primary'
                                : 'border-border hover:border-primary'
                            )}
                          >
                            {reminder.completed && (
                              <Check className="w-4 h-4 text-primary-foreground" />
                            )}
                          </div>
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className={cn(
                                'font-semibold text-sm',
                                reminder.completed && 'line-through text-muted-foreground'
                              )}
                            >
                              {reminder.title}
                            </h4>
                            <span className={cn('px-2.5 py-1 rounded text-xs font-medium border', getPriorityColor(reminder.priority))}>
                              {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className={cn('text-sm text-muted-foreground mb-2', reminder.completed && 'line-through')}>
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {reminder.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {reminder.time}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleOpenDialog(reminder);
                              setIsDateModalOpen(false);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteReminder(reminder.id);
                              toast({ description: 'Reminder deleted' });
                              if (getCalendarReminders(selectedDateOnCalendar).length === 1) {
                                setIsDateModalOpen(false);
                              }
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                {selectedDateOnCalendar && getCalendarReminders(selectedDateOnCalendar).length > 0 && (
                  <Button
                    onClick={() => handleOpenDialog(undefined, selectedDateOnCalendar)}
                    variant="outline"
                    className="w-full gap-2 mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Task
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border mt-8">
        {(['today', 'upcoming', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors relative',
              filterTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {filterTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddReminderDialogOpen} onOpenChange={setIsAddReminderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Reminder' : 'Add New Reminder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Title *</Label>
              <Input
                placeholder="Reminder title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Input
                placeholder="Details (optional)"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData((p) => ({ ...p, priority: v as any }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddReminderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? 'Update' : 'Add'} Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filterTab === 'today' && "No reminders for today"}
            {filterTab === 'upcoming' && "No upcoming reminders"}
            {filterTab === 'all' && "No reminders yet"}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'p-4 rounded-lg border transition-all',
                reminder.completed
                  ? 'bg-muted/50 border-border opacity-60'
                  : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleReminderComplete(reminder.id)}
                  className="flex-shrink-0 mt-1"
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
                      reminder.completed
                        ? 'bg-primary border-primary'
                        : 'border-border hover:border-primary'
                    )}
                  >
                    {reminder.completed && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3
                        className={cn(
                          'font-semibold text-sm',
                          reminder.completed && 'line-through text-muted-foreground'
                        )}
                      >
                        {reminder.title}
                      </h3>
                      {reminder.description && (
                        <p className={cn('text-xs text-muted-foreground mt-1', reminder.completed && 'line-through')}>
                          {reminder.description}
                        </p>
                      )}
                    </div>
                    <div className={cn('px-2.5 py-1 rounded text-xs font-medium border whitespace-nowrap', getPriorityColor(reminder.priority))}>
                      {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(reminder.date)}
                    </div>
                    {reminder.time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {reminder.time}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(reminder)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteReminder(reminder.id);
                      toast({ description: 'Reminder deleted' });
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;
