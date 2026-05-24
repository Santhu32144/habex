import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useExpenses } from '@/contexts/ExpenseContext';
import { useRecurringExpenses } from '@/contexts/RecurringExpenseContext';
import { Search, DollarSign, RotateCw, Calendar } from 'lucide-react';

export const GlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { expenses, selectedYear } = useExpenses();
  const { recurringExpenses } = useRecurringExpenses();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{
      type: 'expense' | 'recurring';
      id: string;
      title: string;
      subtitle: string;
      action: () => void;
    }> = [];

    // Search recurring expenses
    recurringExpenses.forEach((expense) => {
      if (
        expense.name.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query)
      ) {
        results.push({
          type: 'recurring',
          id: expense.id,
          title: expense.name,
          subtitle: `₹${expense.amount} - ${expense.frequency}`,
          action: () => {
            navigate('/recurring');
            setOpen(false);
          },
        });
      }
    });

    // Search expenses by amount, category, or description
    Object.entries(expenses[selectedYear] || {}).forEach(([month, monthData]) => {
      if (typeof monthData === 'object') {
        Object.entries(monthData).forEach(([category, data]) => {
          if (Array.isArray(data)) {
            data.forEach((item, index) => {
              const amount = typeof item === 'number' ? item : item.amount;
              const description = typeof item === 'object' && item.desc ? item.desc : '';

              if (
                amount.toString().includes(query) ||
                category.toLowerCase().includes(query) ||
                description.toLowerCase().includes(query)
              ) {
                const subtitle = description
                  ? `${description} - ₹${amount} (${month} ${selectedYear})`
                  : `${month} ${selectedYear}`;

                results.push({
                  type: 'expense',
                  id: `${month}-${category}-${index}`,
                  title: `${category}: ₹${amount}`,
                  subtitle: subtitle,
                  action: () => {
                    navigate('/months');
                    setOpen(false);
                  },
                });
              }
            });
          }
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [searchQuery, expenses, recurringExpenses, selectedYear, navigate]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex w-48 items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search...</span>
        <kbd className="ml-auto text-xs px-2 py-0.5 bg-background rounded">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search expenses, bills..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {searchResults.length > 0 && (
            <>
              <CommandGroup heading="Results">
                {searchResults.map((result) => {
                  const Icon = result.type === 'recurring' ? RotateCw : DollarSign;
                  return (
                    <CommandItem
                      key={result.id}
                      onSelect={result.action}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{result.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {searchQuery && (
            <CommandGroup heading="Quick Links">
              <CommandItem
                onSelect={() => {
                  navigate('/months');
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>View all expenses</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/recurring');
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                <span>View all recurring</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;
