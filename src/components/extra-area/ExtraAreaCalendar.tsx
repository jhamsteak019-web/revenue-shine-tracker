import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExtraAreaEntry } from '@/hooks/useExtraAreaStore';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

interface ExtraAreaCalendarProps {
  entries: ExtraAreaEntry[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  onAddNew: () => void;
  onEntryClick: (entry: ExtraAreaEntry) => void;
  onDateClick?: (date: Date) => void;
}

// Color mapping for different categories/branches
const getCategoryColor = (category: string, branch: string): string => {
  const key = `${category}-${branch}`.toLowerCase();
  
  // Use branch for color coding
  const branchColors: Record<string, string> = {
    'mhb': 'bg-orange-500 text-white',
    'mlp': 'bg-purple-500 text-white',
    'msh': 'bg-green-500 text-white',
    'mum': 'bg-blue-500 text-white',
    'mqc': 'bg-pink-500 text-white',
  };
  
  const lowerBranch = branch.toLowerCase();
  for (const [branchKey, color] of Object.entries(branchColors)) {
    if (lowerBranch.includes(branchKey)) {
      return color;
    }
  }
  
  // Default color
  return 'bg-primary text-primary-foreground';
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ExtraAreaCalendar: React.FC<ExtraAreaCalendarProps> = ({
  entries,
  selectedMonth,
  onMonthChange,
  onAddNew,
  onEntryClick,
  onDateClick,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  // Get calendar days
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Group entries by date
  const entriesByDate = React.useMemo(() => {
    const map = new Map<string, ExtraAreaEntry[]>();
    entries.forEach((entry) => {
      if (entry.date) {
        const dateKey = entry.date;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(entry);
      }
    });
    return map;
  }, [entries]);

  const handlePrevMonth = () => onMonthChange(subMonths(selectedMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(selectedMonth, 1));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  // Get entries for selected date
  const selectedDateEntries = selectedDate
    ? entriesByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Mini Calendar and Selected Date Info */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Mini Calendar */}
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-xs text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEntries = entriesByDate.get(dateKey) || [];
              const hasEntries = dayEntries.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, selectedMonth);
              
              return (
                <button
                  key={dateKey}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    'text-xs py-1.5 rounded-md transition-colors relative',
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                    isSelected && 'bg-primary text-primary-foreground',
                    isToday(day) && !isSelected && 'bg-accent text-accent-foreground font-semibold',
                    hasEntries && !isSelected && 'bg-primary/20 font-medium',
                    !isSelected && 'hover:bg-muted'
                  )}
                >
                  {format(day, 'd')}
                  {hasEntries && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Info */}
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-2">
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </h3>
          {selectedDate ? (
            selectedDateEntries.length > 0 ? (
              <div className="space-y-2">
                {selectedDateEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onEntryClick(entry)}
                    className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="text-sm font-medium text-foreground truncate">
                      {entry.category} - {entry.locationArea}
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.branch}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No entries on this date</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Click on a date to see entries</p>
          )}
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-xl font-bold text-foreground">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <Button variant="ghost" size="sm" className="rounded-none px-4 bg-muted">
                Month
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none px-4">
                Week
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onMonthChange(new Date())}>
              Today
            </Button>
            <Button size="sm" className="gap-2" onClick={onAddNew}>
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-border/50">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                'py-3 text-center text-sm font-semibold',
                index === 0 && 'text-destructive',
                index === 6 && 'text-primary',
                index !== 0 && index !== 6 && 'text-foreground'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEntries = entriesByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, selectedMonth);
            const dayOfWeek = day.getDay();
            
            return (
              <div
                key={dateKey}
                className={cn(
                  'min-h-[120px] border-b border-r border-border/30 p-2',
                  !isCurrentMonth && 'bg-muted/20',
                  index % 7 === 0 && 'border-l-0',
                  'last:border-r-0'
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      !isCurrentMonth && 'text-muted-foreground/50',
                      isToday(day) && 'w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center',
                      dayOfWeek === 0 && isCurrentMonth && !isToday(day) && 'text-destructive',
                      dayOfWeek === 6 && isCurrentMonth && !isToday(day) && 'text-primary'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Entry Pills */}
                <div className="space-y-1">
                  {dayEntries.slice(0, 3).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => onEntryClick(entry)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-opacity hover:opacity-80',
                        getCategoryColor(entry.category, entry.branch)
                      )}
                      title={`${entry.category} - ${entry.locationArea}`}
                    >
                      {entry.category} {entry.locationArea.substring(0, 15)}
                      {entry.locationArea.length > 15 && '...'}
                    </button>
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-muted-foreground px-2">
                      +{dayEntries.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
