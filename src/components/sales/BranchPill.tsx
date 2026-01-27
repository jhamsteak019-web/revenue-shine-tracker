import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

interface BranchPillProps {
  branch: string;
  amount: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const BranchPill: React.FC<BranchPillProps> = ({
  branch,
  amount,
  isActive = false,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
        onClick && 'cursor-pointer',
        !onClick && 'cursor-default',
        className
      )}
    >
      <span className="font-semibold">{branch}</span>
      <span className="text-xs opacity-80">{formatCurrency(amount)}</span>
    </button>
  );
};
