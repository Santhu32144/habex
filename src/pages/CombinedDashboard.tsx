import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import dashboardHeroVideo from '@/assets/dashboard-hero-video.mp4.asset.json';
import MotivationalQuote from '@/components/MotivationalQuote';
import CurrencyConverter from '@/components/CurrencyConverter';
import { Wallet, Target, TrendingUp, Fuel, DollarSign, Flame, CheckCircle2, Calendar, BarChart3, Crown, CalendarDays, Bell, Loader2 } from 'lucide-react';
import { requestNotificationPermission, sendNotification } from '@/utils/notifications';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useHabits } from '@/contexts/HabitContext';
import { calculateYearTotals } from '@/data/expenseData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StreakLeaderboard from '@/components/StreakLeaderboard';
import HabitBadges from '@/components/HabitBadges';
import HabitCalendarHeatmap from '@/components/HabitCalendarHeatmap';
import { DashboardHabitTracker } from '@/components/DashboardHabitTracker';
import { 
  Heart, Dumbbell, Brain, Coffee, Book, Music, Bike, Moon, Sun, Droplets,
  Utensils, Pill, Cigarette, Wine, Timer, Pencil, Code, Gamepad2, Camera, Palette,
  Calculator, Briefcase, Phone, Mail, MessageSquare, Users, Home, Car, Plane, Map,
  ShoppingCart, Gift, Star, Zap, Trophy, Medal, Award, Flag, Bookmark, Tag,
  Smile, Frown, Meh, Heart as HeartIcon, ThumbsUp, ThumbsDown, Eye, EyeOff
} from 'lucide-react';

const CombinedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getFilteredYearData, selectedYear } = useExpenses();
  const { habits, getCompletionRate } = useHabits();
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const yearData = getFilteredYearData();
  const totals = calculateYearTotals(yearData);

  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    try {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        sendNotification({
          title: '🎉 Test Notification',
          body: 'This is a test notification from HabeX! Your device is ready to receive updates.',
          icon: '/habex-icon-512.png',
        });
      } else {
        // If permission was denied, show a prompt
        const result = window.confirm(
          'Notifications are disabled. Would you like to enable them? You can do this in your browser settings.'
        );
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsTestingNotification(false);
    }
  };
  
  // Get today's date string
  const today = new Date().toISOString().split('T')[0];
  
  // Habit stats - all habits are considered active
  const activeHabits = habits;
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const totalActiveHabits = activeHabits.length;
  const completionPercentage = totalActiveHabits > 0 ? (completedToday / totalActiveHabits) * 100 : 0;
  
  // Calculate current streak for each habit
  const getCurrentStreak = (habit: typeof habits[0]): number => {
    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (habit.completedDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        // Allow today to be incomplete
        break;
      }
    }
    return streak;
  };
  
  // Best streaks
  const topStreaks = [...activeHabits]
    .map(h => ({ ...h, streak: getCurrentStreak(h) }))
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  // Icon map for habit icons
  const iconMap: Record<string, React.ElementType> = {
    Heart, Dumbbell, Brain, Coffee, Book, Music, Bike, Moon, Sun, Droplets,
    Utensils, Pill, Cigarette, Wine, Timer, Pencil, Code, Gamepad2, Camera, Palette,
    Calculator, Briefcase, Phone, Mail, MessageSquare, Users, Home, Car, Plane, Map,
    ShoppingCart, Gift, Star, Zap, Trophy, Medal, Award, Flag, Bookmark, Tag,
    Smile, Frown, Meh, HeartIcon, ThumbsUp, ThumbsDown, Eye, EyeOff, Target, Flame,
  };

  // Monthly expense trend data
  const monthlyExpenseTrend = useMemo(() => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      const monthData = yearData[month];
      if (!monthData) {
        return { month: shortMonths[index], total: 0, self: 0, other: 0 };
      }
      
      const snacksTotal = monthData.snacks?.reduce((a, b) => a + b, 0) || 0;
      const foodTotal = monthData.food?.reduce((a, b) => a + b, 0) || 0;
      const travelTotal = monthData.travellingCharge?.reduce((a, b) => a + b, 0) || 0;
      const petrolTotal = monthData.petrol?.reduce((a, b) => a + b, 0) || 0;
      const otherTotal = monthData.otherExpenses?.reduce((a, b) => a + b.amount, 0) || 0;
      const selfTotal = monthData.selfExpense?.reduce((a, b) => a + b.amount, 0) || 0;
      
      const self = snacksTotal + foodTotal + travelTotal + selfTotal;
      const other = otherTotal;
      
      return {
        month: shortMonths[index],
        total: self + other + petrolTotal,
        self,
        other,
      };
    });
  }, [yearData]);

  // Weekly habit completion data (last 7 days)
  const weeklyHabitData = useMemo(() => {
    const data = [];
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completed = habits.filter(h => h.completedDates.includes(dateStr)).length;
      const total = habits.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      data.push({
        day: dayNames[date.getDay()],
        completed,
        rate,
        total,
      });
    }
    
    return data;
  }, [habits]);

  // Top daily habits - habits with highest completion rate
  const topDailyHabits = useMemo(() => {
    return [...habits]
      .map(habit => ({
        ...habit,
        completionRate: habit.completedDates.length > 0 
          ? Math.round((habit.completedDates.length / 30) * 100) // Last 30 days approx
          : 0,
        streak: getCurrentStreak(habit),
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  }, [habits]);

  // Monthly habit progress data
  const monthlyHabitProgress = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    
    // Calculate completion for each week of the month
    const weeks: { week: string; completed: number; total: number; rate: number }[] = [];
    
    for (let weekNum = 0; weekNum < 5; weekNum++) {
      const startDay = weekNum * 7 + 1;
      const endDay = Math.min((weekNum + 1) * 7, daysInMonth);
      
      if (startDay > daysInMonth) break;
      
      let weekCompleted = 0;
      let weekTotal = 0;
      
      for (let day = startDay; day <= endDay && day <= currentDay; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dailyCompleted = habits.filter(h => h.completedDates.includes(dateStr)).length;
        weekCompleted += dailyCompleted;
        weekTotal += habits.length;
      }
      
      weeks.push({
        week: `Week ${weekNum + 1}`,
        completed: weekCompleted,
        total: weekTotal,
        rate: weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0,
      });
    }
    
    return weeks;
  }, [habits]);

  // Monthly overview stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    
    let totalCompletions = 0;
    let totalPossible = 0;
    
    for (let day = 1; day <= currentDay; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dailyCompleted = habits.filter(h => h.completedDates.includes(dateStr)).length;
      totalCompletions += dailyCompleted;
      totalPossible += habits.length;
    }
    
    const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return {
      month: monthNames[currentMonth],
      completions: totalCompletions,
      possible: totalPossible,
      rate: completionRate,
      daysCompleted: currentDay,
    };
  }, [habits]);

  return (
    <div className="space-y-8">
      {/* Hero Section with Video Background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-lg"
      >
        {/* Full video background */}
        <div className="absolute inset-0 pointer-events-none">
          <video
            src={dashboardHeroVideo.url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/75 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display text-2xl lg:text-3xl font-bold mb-2"
          >
            Dashboard Overview 📊
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-muted-foreground max-w-lg"
          >
            Your combined view of expenses and habits. Stay on top of your finances and build better habits.
          </motion.p>
          <div className="flex items-center gap-4 mt-4">
            <MotivationalQuote />
            <Button
              onClick={handleTestNotification}
              disabled={isTestingNotification}
              variant="outline"
              size="sm"
              className="gap-2 whitespace-nowrap"
            >
              {isTestingNotification ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Test Notification
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Habit Tracker */}
      <DashboardHabitTracker />

      {/* Two-column layout for Expenses and Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Expenses</CardTitle>
                    <CardDescription>{selectedYear} Overview</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')}>
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Expense Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Year Total</span>
                  </div>
                  <p className="text-xl font-bold">₹{totals.yearTotal.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Self</span>
                  </div>
                  <p className="text-xl font-bold">₹{totals.totalSelf.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Other</span>
                  </div>
                  <p className="text-xl font-bold">₹{totals.totalOther.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Fuel className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Petrol</span>
                  </div>
                  <p className="text-xl font-bold">₹{totals.totalPetrol.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Habits Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Target className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Habits</CardTitle>
                    <CardDescription>Today's Progress</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/habits')}>
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Today's completion */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Today's Completion</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {completedToday}/{totalActiveHabits} habits
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>

              {/* Top Streaks */}
              {topStreaks.length > 0 && topStreaks.some(h => h.streak > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Top Streaks
                  </div>
                  <div className="space-y-2">
                    {topStreaks.filter(h => h.streak > 0).map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <span className="text-sm truncate flex-1">{habit.name}</span>
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-3 w-3" />
                          <span className="text-sm font-medium">{habit.streak}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalActiveHabits === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No habits yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1"
                    onClick={() => navigate('/habits/add')}
                  >
                    Add your first habit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements/Badges - Right after Habits Summary */}
        {habits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2"
          >
            <HabitBadges habits={habits} getCurrentStreak={getCurrentStreak} />
          </motion.div>
        )}

        {/* Top Daily Habits */}
        {topDailyHabits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Top Daily Habits</CardTitle>
                    <CardDescription>Most consistent habits</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {topDailyHabits.map((habit, index) => {
                  const IconComponent = iconMap[habit.icon] || Target;
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-500' :
                          index === 1 ? 'bg-gray-400/20 text-gray-500' :
                          index === 2 ? 'bg-amber-700/20 text-amber-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {habit.streak > 0 && (
                          <div className="flex items-center gap-1 text-orange-500 text-xs">
                            <Flame className="h-3 w-3" />
                            <span>{habit.streak}</span>
                          </div>
                        )}
                        <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {habit.completionRate}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Monthly Habit Progress Overview */}
        {habits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CalendarDays className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Monthly Progress</CardTitle>
                    <CardDescription>{monthlyStats.month} Overview</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall monthly stats */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-sm text-muted-foreground">
                      {monthlyStats.completions}/{monthlyStats.possible} completions
                    </span>
                  </div>
                  <Progress value={monthlyStats.rate} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{monthlyStats.rate}% complete</span>
                    <span>Day {monthlyStats.daysCompleted}</span>
                  </div>
                </div>

                {/* Weekly breakdown */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Weekly Breakdown</span>
                  <div className="space-y-2">
                    {monthlyHabitProgress.map((week, index) => (
                      <div key={week.week} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-14">{week.week}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              week.rate >= 80 ? 'bg-green-500' :
                              week.rate >= 50 ? 'bg-amber-500' :
                              week.rate > 0 ? 'bg-orange-500' : 'bg-muted'
                            }`}
                            style={{ width: `${week.rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-10 text-right">{week.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Calendar Heatmap and Month Comparison */}
      {habits.length > 0 && <HabitCalendarHeatmap habits={habits} />}

      {/* Trend Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expense Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Monthly Expense Trend</CardTitle>
                  <CardDescription>{selectedYear} spending pattern</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyExpenseTrend}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Total']}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorTotal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Habit Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Weekly Habit Completion</CardTitle>
                  <CardDescription>Last 7 days completion rate</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyHabitData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'rate') return [`${value}%`, 'Completion Rate'];
                        return [value, name];
                      }}
                    />
                    <Bar
                      dataKey="rate"
                      fill="hsl(142, 76%, 36%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>


      {/* Streak Leaderboard */}
      {habits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <StreakLeaderboard habits={habits} iconMap={iconMap} />
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/add')}
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-xs">Add Expense</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/habits/add')}
              >
                <Target className="h-5 w-5" />
                <span className="text-xs">Add Habit</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/months')}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Monthly View</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/habits/challenge')}
              >
                <Flame className="h-5 w-5" />
                <span className="text-xs">21 Day Challenge</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Currency Converter */}
        <CurrencyConverter />
      </motion.div>
    </div>
  );
};

export default CombinedDashboard;
