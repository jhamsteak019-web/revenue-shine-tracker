import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';

interface CategoryCardProps {
  category: string;
  branch: string;
  totalAmount: number;
  soldCount: number;
  onClick?: () => void;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  branch,
  totalAmount,
  soldCount,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card rounded-xl p-5 card-shadow transition-all',
        onClick && 'cursor-pointer card-hover',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant="secondary" className="text-xs font-medium">
          {branch}
        </Badge>
        <Badge className="bg-accent text-accent-foreground">
          {soldCount} sold
        </Badge>
      </div>
      
      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{category}</h3>
      <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
      
      {soldCount === 0 && (
        <p className="text-xs text-muted-foreground mt-2">No sales this period</p>
      )}
    </div>
  );
};
