import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMonthYear } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface MonthYearPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(value.getFullYear());

  const handleMonthSelect = (monthIndex: number) => {
    onChange(new Date(viewYear, monthIndex, 1));
    setOpen(false);
  };

  const handlePrevYear = () => setViewYear(prev => prev - 1);
  const handleNextYear = () => setViewYear(prev => prev + 1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white',
            className
          )}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {formatMonthYear(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-popover" align="end">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePrevYear}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-foreground">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isSelected =
              value.getMonth() === index && value.getFullYear() === viewYear;
            const isFuture = new Date(viewYear, index, 1) > new Date();
            
            return (
              <Button
                key={month}
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                disabled={isFuture}
                className={cn(
                  'h-9',
                  isSelected && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
