import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, CalendarDays, ArrowUp, ArrowDown, X, CheckCircle2, XCircle, Calendar, Flame, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useHabits } from '@/contexts/HabitContext';
import HeatmapExportShare from './HeatmapExportShare';

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDates: string[];
  category?: string;
}

interface HabitCalendarHeatmapProps {
  habits: Habit[];
}

const HabitCalendarHeatmap: React.FC<HabitCalendarHeatmapProps> = ({ habits }) => {
  const { updateHabit } = useHabits();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  const [selectedDay, setSelectedDay] = useState<{ date: number; dateStr: string; completed: number; rate: number } | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);

  const handleToggleHabitCompletion = async (habit: Habit, dateStr: string) => {
    setIsUpdating(habit.id);
    try {
      const isCompleted = habit.completedDates.includes(dateStr);
      const updatedDates = isCompleted
        ? habit.completedDates.filter(d => d !== dateStr)
        : [...habit.completedDates, dateStr];

      await updateHabit(habit.id, { completedDates: updatedDates });
    } catch (error) {
      console.error('Error updating habit:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Get unique categories from habits
  const categories = useMemo(() => {
    const cats = [...new Set(habits.map(h => h.category).filter(Boolean))];
    return cats.sort();
  }, [habits]);

  // Filter habits by category
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'all') return habits;
    return habits.filter(h => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // Generate calendar data for current month
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const totalHabits = filteredHabits.length;

    const days: { date: number; dateStr: string; completed: number; rate: number; isFuture: boolean; isEmpty: boolean }[] = [];

    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ date: 0, dateStr: '', completed: 0, rate: 0, isFuture: false, isEmpty: true });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const completed = filteredHabits.filter(h => h.completedDates.includes(dateStr)).length;
      const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
      const isFuture = day > currentDay;

      days.push({ date: day, dateStr, completed, rate, isFuture, isEmpty: false });
    }

    return days;
  }, [filteredHabits, currentMonth, currentYear, currentDay]);

  // Generate yearly heatmap data (GitHub style - last 12 months) with streak info
  const yearlyData = useMemo(() => {
    const totalHabits = filteredHabits.length;
    const weeks: { days: { date: Date; dateStr: string; completed: number; rate: number; isFuture: boolean; isStreakDay: boolean; streakLength: number }[] }[] = [];
    
    // Start from 52 weeks ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First pass: collect all day data
    const allDays: { date: Date; dateStr: string; completed: number; rate: number; isFuture: boolean }[] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < 53 * 7; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const completed = filteredHabits.filter(h => h.completedDates.includes(dateStr)).length;
      const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
      const isFuture = currentDate > today;
      
      allDays.push({
        date: new Date(currentDate),
        dateStr,
        completed,
        rate,
        isFuture
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Second pass: calculate streaks (consecutive days with >= 50% completion)
    const daysWithStreaks: { date: Date; dateStr: string; completed: number; rate: number; isFuture: boolean; isStreakDay: boolean; streakLength: number }[] = [];
    
    for (let i = 0; i < allDays.length; i++) {
      const day = allDays[i];
      const isCompletionDay = day.rate >= 50 && !day.isFuture;
      
      // Calculate streak length at this position
      let streakLength = 0;
      if (isCompletionDay) {
        // Count consecutive days backwards
        let j = i;
        while (j >= 0 && allDays[j].rate >= 50 && !allDays[j].isFuture) {
          streakLength++;
          j--;
        }
      }
      
      daysWithStreaks.push({
        ...day,
        isStreakDay: isCompletionDay && streakLength >= 3, // Mark as streak if 3+ consecutive days
        streakLength
      });
    }
    
    // Group into weeks
    for (let week = 0; week < 53; week++) {
      const weekDays = daysWithStreaks.slice(week * 7, (week + 1) * 7);
      weeks.push({ days: weekDays });
    }
    
    return weeks;
  }, [filteredHabits]);

  // Get month labels for yearly view
  const monthLabels = useMemo(() => {
    const labels: { month: string; week: number }[] = [];
    let lastMonth = -1;
    
    yearlyData.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.days[0].date;
      const month = firstDayOfWeek.getMonth();
      
      if (month !== lastMonth) {
        labels.push({ month: shortMonthNames[month], week: weekIndex });
        lastMonth = month;
      }
    });
    
    return labels;
  }, [yearlyData]);

  // Calculate month-over-month comparison
  const monthComparison = useMemo(() => {
    const totalHabits = habits.length;
    if (totalHabits === 0) return { current: 0, previous: 0, change: 0, trend: 'neutral' as const };

    // Current month stats (up to current day)
    let currentCompletions = 0;
    let currentPossible = 0;
    for (let day = 1; day <= currentDay; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      currentCompletions += habits.filter(h => h.completedDates.includes(dateStr)).length;
      currentPossible += totalHabits;
    }
    const currentRate = currentPossible > 0 ? Math.round((currentCompletions / currentPossible) * 100) : 0;

    // Previous month stats (same number of days for fair comparison)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    const compareDays = Math.min(currentDay, daysInPrevMonth);

    let prevCompletions = 0;
    let prevPossible = 0;
    for (let day = 1; day <= compareDays; day++) {
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      prevCompletions += habits.filter(h => h.completedDates.includes(dateStr)).length;
      prevPossible += totalHabits;
    }
    const prevRate = prevPossible > 0 ? Math.round((prevCompletions / prevPossible) * 100) : 0;

    const change = currentRate - prevRate;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

    return { current: currentRate, previous: prevRate, change, trend };
  }, [habits, currentMonth, currentYear, currentDay]);

  // Get habits for selected day
  const selectedDayHabits = useMemo(() => {
    if (!selectedDay) return { completed: [], incomplete: [] };
    
    const completed = habits.filter(h => h.completedDates.includes(selectedDay.dateStr));
    const incomplete = habits.filter(h => !h.completedDates.includes(selectedDay.dateStr));
    
    return { completed, incomplete };
  }, [selectedDay, habits]);

  // Get color based on completion rate
  const getHeatmapColor = (rate: number, isFuture: boolean, isEmpty?: boolean) => {
    if (isEmpty) return 'bg-transparent';
    if (isFuture) return 'bg-muted/30';
    if (rate === 0) return 'bg-muted/50';
    if (rate < 25) return 'bg-red-500/30';
    if (rate < 50) return 'bg-orange-500/40';
    if (rate < 75) return 'bg-amber-500/50';
    if (rate < 100) return 'bg-green-500/60';
    return 'bg-green-500';
  };

  const handleDayClick = (day: { date: number; dateStr: string; completed: number; rate: number; isFuture: boolean; isEmpty: boolean }) => {
    if (!day.isEmpty && !day.isFuture) {
      setSelectedDay({ date: day.date, dateStr: day.dateStr, completed: day.completed, rate: day.rate });
    }
  };

  const handleYearDayClick = (day: { date: Date; dateStr: string; completed: number; rate: number; isFuture: boolean }) => {
    if (!day.isFuture) {
      setSelectedDay({ date: day.date.getDate(), dateStr: day.dateStr, completed: day.completed, rate: day.rate });
    }
  };

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  if (habits.length === 0) return null;

  return (
    <>
      <div className="space-y-6">
        {/* Heatmap Card with View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Habit Heatmap</CardTitle>
                      <CardDescription>Click any day to see details</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeatmapExportShare heatmapRef={heatmapRef} habits={habits} />
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'year')}>
                      <TabsList className="h-8">
                        <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
                        <TabsTrigger value="year" className="text-xs px-3">Year</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                
                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {filteredHabits.length} habit{filteredHabits.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div ref={heatmapRef} className="p-1">
              <AnimatePresence mode="wait">
                {viewMode === 'month' ? (
                  <motion.div
                    key="month"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Month View */}
                    <div className="text-center text-sm font-medium text-muted-foreground mb-3">
                      {monthNames[currentMonth]} {currentYear}
                    </div>
                    
                    {/* Day labels */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayLabels.map((day, i) => (
                        <div key={i} className="text-center text-xs text-muted-foreground font-medium">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <TooltipProvider>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarData.map((day, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleDayClick(day)}
                                disabled={day.isEmpty || day.isFuture}
                                className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                                  getHeatmapColor(day.rate, day.isFuture, day.isEmpty)
                                } ${day.date === currentDay ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''} ${
                                  !day.isEmpty && !day.isFuture && day.rate === 100 ? 'text-white' : 'text-foreground/70'
                                } ${!day.isEmpty && !day.isFuture ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : 'cursor-default'}`}
                              >
                                {day.isEmpty ? '' : day.date}
                              </button>
                            </TooltipTrigger>
                            {!day.isEmpty && !day.isFuture && (
                              <TooltipContent>
                                <p className="font-medium">{monthNames[currentMonth]} {day.date}</p>
                                <p className="text-xs text-muted-foreground">
                                  {day.completed}/{habits.length} habits ({day.rate}%)
                                </p>
                                <p className="text-xs text-primary mt-1">Click to view details</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </motion.div>
                ) : (
                  <motion.div
                    key="year"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Yearly GitHub-style View */}
                    <div className="text-center text-sm font-medium text-muted-foreground mb-3">
                      Last 12 Months
                    </div>
                    
                    <div className="w-full">
                        {/* Month labels */}
                        <div className="flex justify-between mb-2 pl-8">
                          {monthLabels.map((label, i) => (
                            <div 
                              key={i} 
                              className="text-xs text-muted-foreground flex-shrink-0"
                            >
                              {label.month}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex w-full">
                          {/* Day labels */}
                          <div className="flex flex-col justify-between mr-2 text-xs text-muted-foreground flex-shrink-0 py-[2px]">
                            <div className="h-4 flex items-center"></div>
                            <div className="h-4 flex items-center">M</div>
                            <div className="h-4 flex items-center"></div>
                            <div className="h-4 flex items-center">W</div>
                            <div className="h-4 flex items-center"></div>
                            <div className="h-4 flex items-center">F</div>
                            <div className="h-4 flex items-center"></div>
                          </div>
                          
                          {/* Weeks grid - flex to fill width */}
                          <TooltipProvider>
                            <div className="flex flex-1 justify-between gap-[1px]">
                              {yearlyData.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[2px]">
                                  {week.days.map((day, dayIndex) => (
                                    <Tooltip key={dayIndex}>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => handleYearDayClick(day)}
                                          disabled={day.isFuture}
                                          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all relative ${
                                            getHeatmapColor(day.rate, day.isFuture)
                                          } ${day.isStreakDay ? 'ring-1 ring-orange-400 ring-offset-1 ring-offset-background' : ''} ${!day.isFuture ? 'cursor-pointer hover:ring-1 hover:ring-primary/50' : 'cursor-default'}`}
                                        >
                                          {day.isStreakDay && day.streakLength >= 7 && (
                                            <Flame className="absolute -top-1 -right-1 h-2 w-2 text-orange-500 fill-orange-400" />
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      {!day.isFuture && (
                                        <TooltipContent>
                                          <p className="font-medium">
                                            {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {day.completed}/{filteredHabits.length} habits ({day.rate}%)
                                          </p>
                                          {day.isStreakDay && (
                                            <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                                              <Flame className="h-3 w-3" />
                                              {day.streakLength} day streak!
                                            </p>
                                          )}
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </TooltipProvider>
                        </div>
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-muted/50" />
                    <div className="w-3 h-3 rounded-sm bg-red-500/30" />
                    <div className="w-3 h-3 rounded-sm bg-orange-500/40" />
                    <div className="w-3 h-3 rounded-sm bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-sm bg-green-500/60" />
                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                  </div>
                  <span>More</span>
                </div>
                {viewMode === 'year' && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-green-500/60 ring-1 ring-orange-400" />
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span>Streak (3+ days)</span>
                  </div>
                )}
              </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Month-over-Month Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  monthComparison.trend === 'up' ? 'bg-green-500/10' :
                  monthComparison.trend === 'down' ? 'bg-red-500/10' :
                  'bg-muted/50'
                }`}>
                  {monthComparison.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : monthComparison.trend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Month Comparison</CardTitle>
                  <CardDescription>vs {shortMonthNames[prevMonth]} (first {currentDay} days)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Big comparison display */}
              <div className="flex items-center justify-center gap-8">
                {/* Previous month */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{shortMonthNames[prevMonth]}</p>
                  <p className="text-3xl font-bold text-muted-foreground">{monthComparison.previous}%</p>
                </div>

                {/* Arrow indicator */}
                <div className={`flex flex-col items-center ${
                  monthComparison.trend === 'up' ? 'text-green-500' :
                  monthComparison.trend === 'down' ? 'text-red-500' :
                  'text-muted-foreground'
                }`}>
                  {monthComparison.trend === 'up' ? (
                    <ArrowUp className="h-6 w-6" />
                  ) : monthComparison.trend === 'down' ? (
                    <ArrowDown className="h-6 w-6" />
                  ) : (
                    <Minus className="h-6 w-6" />
                  )}
                  <span className="text-sm font-medium">
                    {monthComparison.change > 0 ? '+' : ''}{monthComparison.change}%
                  </span>
                </div>

                {/* Current month */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{shortMonthNames[currentMonth]}</p>
                  <p className="text-3xl font-bold text-primary">{monthComparison.current}%</p>
                </div>
              </div>

              {/* Visual comparison bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">{shortMonthNames[prevMonth]}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-muted-foreground/50 rounded-full transition-all"
                      style={{ width: `${monthComparison.previous}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{monthComparison.previous}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">{shortMonthNames[currentMonth]}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        monthComparison.trend === 'up' ? 'bg-green-500' :
                        monthComparison.trend === 'down' ? 'bg-red-500' :
                        'bg-primary'
                      }`}
                      style={{ width: `${monthComparison.current}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-10 text-right">{monthComparison.current}%</span>
                </div>
              </div>

              {/* Insight message */}
              <div className={`p-3 rounded-lg text-sm text-center ${
                monthComparison.trend === 'up' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                monthComparison.trend === 'down' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {monthComparison.trend === 'up' ? (
                  <>🎉 Great progress! You're {monthComparison.change}% more consistent this month.</>
                ) : monthComparison.trend === 'down' ? (
                  <>📈 Keep pushing! You're {Math.abs(monthComparison.change)}% behind last month's pace.</>
                ) : (
                  <>⚡ Staying steady! Your consistency matches last month.</>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {selectedDay && new Date(selectedDay.dateStr).toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })}
            </DialogTitle>
            <DialogDescription>
              {selectedDay && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedDay.rate === 100 ? 'bg-green-500/20 text-green-600' :
                  selectedDay.rate >= 50 ? 'bg-amber-500/20 text-amber-600' :
                  selectedDay.rate > 0 ? 'bg-orange-500/20 text-orange-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {selectedDay.completed}/{habits.length} completed ({selectedDay.rate}%)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 pr-4">
              {/* Completed habits */}
              {selectedDayHabits.completed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed ({selectedDayHabits.completed.length})
                  </h4>
                  <div className="space-y-1">
                    {selectedDayHabits.completed.map(habit => (
                      <button
                        key={habit.id}
                        onClick={() => selectedDay && handleToggleHabitCompletion(habit, selectedDay.dateStr)}
                        disabled={isUpdating === habit.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50 text-left"
                      >
                        <span className="text-lg">{habit.icon}</span>
                        <span className="text-sm font-medium flex-1">{habit.name}</span>
                        {isUpdating === habit.id ? (
                          <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Incomplete habits */}
              {selectedDayHabits.incomplete.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    Not Completed ({selectedDayHabits.incomplete.length})
                  </h4>
                  <div className="space-y-1">
                    {selectedDayHabits.incomplete.map(habit => (
                      <button
                        key={habit.id}
                        onClick={() => selectedDay && handleToggleHabitCompletion(habit, selectedDay.dateStr)}
                        disabled={isUpdating === habit.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-muted hover:bg-muted/70 hover:border-primary/30 transition-colors disabled:opacity-50 text-left"
                      >
                        <span className="text-lg opacity-50">{habit.icon}</span>
                        <span className="text-sm text-muted-foreground flex-1">{habit.name}</span>
                        {isUpdating === habit.id ? (
                          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {habits.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No habits tracked on this day
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HabitCalendarHeatmap;