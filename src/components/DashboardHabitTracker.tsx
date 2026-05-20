import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { CheckCircle2, Circle, Flame, Target } from 'lucide-react';
import { useHabits } from '@/contexts/HabitContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Heart, Dumbbell, Brain, Coffee, Book, Music, Bike, Moon, Sun, Droplets,
  Utensils, Pill, Cigarette, Wine, Timer, Pencil, Code, Gamepad2, Camera, Palette,
  Calculator, Briefcase, Phone, Mail, MessageSquare, Users, Home, Car, Plane, Map,
  ShoppingCart, Gift, Star, Zap, Trophy, Medal, Award, Flag, Bookmark, Tag,
  Smile, Frown, Meh, Heart as HeartIcon, ThumbsUp, ThumbsDown, Eye, EyeOff
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Heart, Dumbbell, Brain, Coffee, Book, Music, Bike, Moon, Sun, Droplets,
  Utensils, Pill, Cigarette, Wine, Timer, Pencil, Code, Gamepad2, Camera, Palette,
  Calculator, Briefcase, Phone, Mail, MessageSquare, Users, Home, Car, Plane, Map,
  ShoppingCart, Gift, Star, Zap, Trophy, Medal, Award, Flag, Bookmark, Tag,
  Smile, Frown, Meh, HeartIcon, ThumbsUp, ThumbsDown, Eye, EyeOff, Target, Flame,
};

export const DashboardHabitTracker: React.FC = () => {
  const { habits, toggleHabitCompletion } = useHabits();

  // Last 7 days
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
      };
    });
  }, []);

  // Calculate streaks
  const calculateHabitStreak = (habit: typeof habits[0]) => {
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (habit.completedDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  if (habits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Quick Habits</CardTitle>
              <CardDescription>Last 7 days • Tap to update</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Desktop: Date Header */}
            <div className="hidden md:flex items-center gap-2 mb-2">
              <div className="w-40 flex-shrink-0" />
              <div className="flex gap-2 flex-1">
                {last7Days.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`flex-1 text-center text-xs transition-colors ${
                      day.isToday ? 'bg-primary/10 rounded-lg py-2' : 'py-2'
                    }`}
                  >
                    <div className="text-muted-foreground font-medium">{day.label}</div>
                    <div className={`text-sm font-semibold ${day.isToday ? 'text-primary' : ''}`}>
                      {day.dayNum}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-12" />
            </div>

            {/* Habits List */}
            {habits.map((habit) => {
              const IconComponent = iconMap[habit.icon] || Target;
              const streak = calculateHabitStreak(habit);
              const completedInPeriod = last7Days.filter((day) =>
                habit.completedDates.includes(day.dateStr)
              ).length;
              const rate = Math.round((completedInPeriod / last7Days.length) * 100);

              return (
                <div key={habit.id}>
                  {/* Mobile: Habit Header */}
                  <div className="md:hidden flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="p-2 rounded-md flex-shrink-0"
                        style={{ backgroundColor: `${habit.color}20` }}
                      >
                        <IconComponent className="h-5 w-5" style={{ color: habit.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{habit.name}</div>
                        {streak > 0 && (
                          <div className="text-xs text-orange-500 flex items-center gap-0.5">
                            <Flame className="h-3 w-3" />
                            {streak} day
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground min-w-fit ml-2">{rate}%</div>
                  </div>

                  {/* Desktop: Horizontal layout */}
                  <div className="hidden md:flex md:items-center md:gap-2 md:group md:py-2 md:px-2 md:rounded-lg md:hover:bg-muted/50 md:transition-colors">
                    {/* Desktop: Habit name and streak */}
                    <div className="w-40 flex-shrink-0 flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: `${habit.color}20` }}
                      >
                        <IconComponent className="h-4 w-4" style={{ color: habit.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{habit.name}</div>
                        {streak > 0 && (
                          <div className="text-xs text-orange-500 flex items-center gap-0.5">
                            <Flame className="h-3 w-3" />
                            {streak}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop: Circles */}
                    <div className="flex gap-2 flex-1">
                      {last7Days.map((day) => {
                        const isCompleted = habit.completedDates.includes(day.dateStr);

                        return (
                          <TooltipProvider key={day.dateStr}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => toggleHabitCompletion(habit.id, day.dateStr)}
                                  className="flex-1 flex items-center justify-center h-10 rounded-full transition-all hover:scale-110 active:scale-95"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2
                                      className="h-6 w-6"
                                      style={{ color: habit.color }}
                                    />
                                  ) : (
                                    <Circle className="h-6 w-6 text-muted-foreground/30 group-hover:text-muted-foreground/50" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p>{format(day.date, 'MMM d, yyyy')}</p>
                                <p>{isCompleted ? '✓ Done' : 'Not done'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>

                    {/* Desktop: Completion rate */}
                    <div className="w-12 text-center text-sm font-medium">{rate}%</div>
                  </div>

                  {/* Mobile: Habit circles */}
                  <div className="md:hidden grid grid-cols-7 gap-2 px-2 py-3 bg-muted/30 rounded-lg">
                    {last7Days.map((day) => {
                      const isCompleted = habit.completedDates.includes(day.dateStr);

                      return (
                        <TooltipProvider key={day.dateStr}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => toggleHabitCompletion(habit.id, day.dateStr)}
                                className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all active:scale-95 hover:bg-muted/70"
                              >
                                {isCompleted ? (
                                  <CheckCircle2
                                    className="h-8 w-8"
                                    style={{ color: habit.color }}
                                  />
                                ) : (
                                  <Circle className="h-8 w-8 text-muted-foreground/40" />
                                )}
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  {day.label.slice(0, 1)}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>{format(day.date, 'MMM d')}</p>
                              <p>{isCompleted ? '✓ Done' : 'Not done'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
