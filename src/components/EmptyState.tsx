import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Heart,
  BookOpen,
  Zap,
  TrendingUp,
  Plus,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const defaultIcons: Record<string, LucideIcon> = {
  expenses: DollarSign,
  habits: Heart,
  notebook: BookOpen,
  investments: TrendingUp,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  emoji = '📭',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{emoji}</div>
      {Icon && (
        <div className="mb-4">
          <Icon className="w-16 h-16 text-muted-foreground opacity-30" />
        </div>
      )}
      <h3 className="text-2xl font-semibold text-foreground text-center mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex gap-3 flex-wrap justify-center">
          {actionLabel && onAction && (
            <Button onClick={onAction} className="gap-2">
              <Plus className="w-4 h-4" />
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
