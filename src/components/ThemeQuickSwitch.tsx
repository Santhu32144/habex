import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const ThemeQuickSwitch: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const handleThemeToggle = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('habex-theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          aria-label="Toggle dark mode"
          className="hover:bg-primary/10"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</TooltipContent>
    </Tooltip>
  );
};
