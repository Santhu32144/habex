import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'input';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
}) => {
  const baseClass = 'animate-pulse bg-muted rounded';

  const variants = {
    card: 'h-32 w-full',
    text: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    input: 'h-10 w-full rounded-lg',
  };

  return (
    <div className={cn(baseClass, variants[variant], className)} />
  );
};

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'dashboard' | 'form';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'list',
  count = 3,
}) => {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton variant="card" />
            <Skeleton variant="text" className="h-3 w-2/3" />
            <Skeleton variant="text" className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-lg">
            <Skeleton variant="circle" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-1/2 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Skeleton className="h-8 w-1/3" />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton variant="input" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default Skeleton;
