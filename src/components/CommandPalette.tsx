import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Plus,
  TrendingUp,
  Calendar,
  RotateCw,
  BookOpen,
  Zap,
  Target,
  Share2,
  Gamepad2,
  Settings,
  Search,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(open => !open);
      }
      // Also open on "/" key
      if (e.key === '/' && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = useMemo(() => [
    {
      category: 'Quick Actions',
      items: [
        { label: 'Add Expense', icon: Plus, action: () => { navigate('/add'); setOpen(false); } },
        { label: 'Add Habit', icon: Target, action: () => { navigate('/habits/add'); setOpen(false); } },
        { label: 'Add Note', icon: BookOpen, action: () => { navigate('/notebook'); setOpen(false); } },
      ],
    },
    {
      category: 'Navigation',
      items: [
        { label: 'Dashboard', icon: TrendingUp, action: () => { navigate('/'); setOpen(false); } },
        { label: 'Monthly View', icon: Calendar, action: () => { navigate('/months'); setOpen(false); } },
        { label: 'Expenses', icon: Plus, action: () => { navigate('/expenses'); setOpen(false); } },
        { label: 'Recurring Bills', icon: RotateCw, action: () => { navigate('/recurring'); setOpen(false); } },
        { label: 'Habits', icon: Target, action: () => { navigate('/habits'); setOpen(false); } },
        { label: 'Notebook', icon: BookOpen, action: () => { navigate('/notebook'); setOpen(false); } },
        { label: 'Investments', icon: Share2, action: () => { navigate('/investments'); setOpen(false); } },
        { label: 'Games', icon: Gamepad2, action: () => { navigate('/games'); setOpen(false); } },
      ],
    },
    {
      category: 'Settings',
      items: [
        { label: 'Settings', icon: Settings, action: () => { navigate('/settings'); setOpen(false); } },
      ],
    },
  ], [navigate]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands or press '/' ..." />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        {commands.map((group) => (
          <React.Fragment key={group.category}>
            <CommandGroup heading={group.category}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.label}
                    onSelect={item.action}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {group.category !== commands[commands.length - 1].category && <CommandSeparator />}
          </React.Fragment>
        ))}
      </CommandList>
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <kbd className="rounded bg-muted px-2 py-1 text-xs font-semibold">⌘K</kbd> to toggle
          <kbd className="ml-2 rounded bg-muted px-2 py-1 text-xs font-semibold">/</kbd> to search
          <kbd className="ml-2 rounded bg-muted px-2 py-1 text-xs font-semibold">Esc</kbd> to close
        </p>
      </div>
    </CommandDialog>
  );
};

export default CommandPalette;
