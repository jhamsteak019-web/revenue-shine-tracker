import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  children,
  action,
  className,
  contentClassName,
}) => {
  return (
    <div className={cn('bg-card rounded-xl card-shadow overflow-hidden animate-fade-in', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-6', contentClassName)}>
        {children}
      </div>
    </div>
  );
};
