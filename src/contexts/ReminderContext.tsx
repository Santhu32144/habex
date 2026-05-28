import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format (optional)
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  getTodayReminders: () => Reminder[];
  getUpcomingReminders: () => Reminder[];
  toggleReminderComplete: (id: string) => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

const REMINDERS_STORAGE_KEY = 'habex-reminders';

export const ReminderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem(REMINDERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever reminders change
  useEffect(() => {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const addReminder = (reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [newReminder, ...prev]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id ? { ...reminder, ...updates } : reminder
      )
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  };

  const getTodayReminders = () => {
    const today = getTodayDate();
    return reminders
      .filter((r) => r.date === today)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return (a.time || '').localeCompare(b.time || '');
      });
  };

  const getUpcomingReminders = () => {
    const today = getTodayDate();
    return reminders
      .filter((r) => r.date > today && !r.completed)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  };

  const toggleReminderComplete = (id: string) => {
    updateReminder(id, { completed: !reminders.find((r) => r.id === id)?.completed });
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        getTodayReminders,
        getUpcomingReminders,
        toggleReminderComplete,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};
