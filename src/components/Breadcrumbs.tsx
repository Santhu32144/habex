import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/expenses': 'Expenses',
  '/months': 'Monthly View',
  '/add': 'Add Expense',
  '/recurring': 'Recurring Bills',
  '/habits': 'Habits',
  '/habits/add': 'Add Habit',
  '/habits/challenge': 'Challenge',
  '/notebook': 'Notebook',
  '/investments': 'Investments',
  '/games': 'Games',
  '/settings': 'Settings',
};

interface Breadcrumb {
  label: string;
  path: string;
  current: boolean;
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const generateBreadcrumbs = (): Breadcrumb[] => {
    const pathname = location.pathname;

    // Get the breadcrumb label
    let currentLabel = breadcrumbMap[pathname] || 'Page';

    // For dynamic routes like /investments/:groupId
    if (pathname.includes('/investments/') && pathname !== '/investments') {
      currentLabel = 'Investment Details';
    }

    const breadcrumbs: Breadcrumb[] = [
      { label: 'Home', path: '/', current: false },
    ];

    // Only show additional breadcrumbs if not on home
    if (pathname !== '/') {
      breadcrumbs.push({
        label: currentLabel,
        path: pathname,
        current: true,
      });
    } else {
      breadcrumbs[0].current = true;
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav
      className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
      aria-label="Breadcrumbs"
    >
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
          <button
            onClick={() => navigate(breadcrumb.path)}
            className={cn(
              'transition-colors hover:text-foreground',
              breadcrumb.current && 'text-foreground font-medium cursor-default'
            )}
            aria-current={breadcrumb.current ? 'page' : undefined}
          >
            {breadcrumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
