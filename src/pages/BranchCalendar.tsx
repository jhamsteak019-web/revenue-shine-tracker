import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Loader2, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { useBranchCalendarStore, BranchCalendarTask } from '@/hooks/useBranchCalendarStore';
import { toast } from '@/hooks/use-toast';
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

const BRANCHES = ['MHB', 'MLP', 'MSH', 'MUM', 'MQC'];
const TASK_COLORS = [
  { value: 'orange', label: 'Orange', class: 'bg-orange-500 text-white' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500 text-white' },
  { value: 'green', label: 'Green', class: 'bg-emerald-500 text-white' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500 text-white' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500 text-white' },
];

const getColorClass = (color: string): string => {
  const found = TASK_COLORS.find((c) => c.value === color);
  return found?.class || 'bg-primary text-primary-foreground';
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const BranchCalendar: React.FC = () => {
  const { tasks, loading, addTask, updateTask, removeTask } = useBranchCalendarStore();
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<BranchCalendarTask | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    branch: '',
    taskDate: '',
    taskType: 'event',
    color: 'blue',
  });

  // Get calendar days
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Group tasks by date
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, BranchCalendarTask[]>();
    tasks.forEach((task) => {
      if (task.taskDate) {
        const dateKey = task.taskDate;
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));
  const handleToday = () => setSelectedMonth(new Date());

  // Get tasks for selected date
  const selectedDateTasks = selectedDate
    ? tasksByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      branch: '',
      taskDate: '',
      taskType: 'event',
      color: 'blue',
    });
    setEditingTask(null);
  };

  const handleAddNew = (date?: Date) => {
    resetForm();
    if (date) {
      setFormData((prev) => ({ ...prev, taskDate: format(date, 'yyyy-MM-dd') }));
    }
    setDialogOpen(true);
  };

  const handleEdit = (task: BranchCalendarTask) => {
    setFormData({
      title: task.title,
      description: task.description,
      branch: task.branch,
      taskDate: task.taskDate,
      taskType: task.taskType,
      color: task.color,
    });
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this task?')) {
      try {
        await removeTask(id);
        toast({ title: 'Task deleted', description: 'Calendar task removed.' });
      } catch {
        toast({ title: 'Error', description: 'Failed to delete task.', variant: 'destructive' });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.branch || !formData.taskDate) {
      toast({ title: 'Missing fields', description: 'Please fill in Title, Branch, and Date.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
        toast({ title: 'Task updated', description: 'Calendar task has been updated.' });
      } else {
        await addTask(formData);
        toast({ title: 'Task added', description: 'New calendar task created.' });
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      toast({ title: 'Error', description: 'Failed to save task.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="gradient-header px-4 lg:px-6 py-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Branch Calendar</h1>
              <p className="text-white/70 text-sm">Manage branch activities, events, and promotions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
            {/* Left Sidebar - Mini Calendar and Selected Date Info */}
            <div className="w-72 flex-shrink-0 space-y-4">
              {/* Mini Calendar */}
              <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold text-foreground">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
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
                    const dayTasks = tasksByDate.get(dateKey) || [];
                    const hasTasks = dayTasks.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, selectedMonth);
                    
                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'text-xs py-1.5 rounded-md transition-colors relative',
                          isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50',
                          isSelected && 'bg-primary text-primary-foreground',
                          isToday(day) && !isSelected && 'bg-accent text-accent-foreground font-semibold',
                          hasTasks && !isSelected && 'bg-primary/20 font-medium',
                          !isSelected && 'hover:bg-muted'
                        )}
                      >
                        {format(day, 'd')}
                        {hasTasks && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Info */}
              <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </h3>
                  {selectedDate && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleAddNew(selectedDate)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {selectedDate ? (
                  selectedDateTasks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium mb-1', getColorClass(task.color))}>
                                {task.branch}
                              </div>
                              <div className="text-sm font-medium text-foreground truncate">
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-xs text-muted-foreground truncate">{task.description}</div>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(task)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(task.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tasks on this date</p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Click on a date to see tasks</p>
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
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleToday}>
                    Today
                  </Button>
                  <Button size="sm" className="gap-2" onClick={() => handleAddNew()}>
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
                  const dayTasks = tasksByDate.get(dateKey) || [];
                  const isCurrentMonth = isSameMonth(day, selectedMonth);
                  const dayOfWeek = day.getDay();
                  
                  return (
                    <div
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'min-h-[120px] border-b border-r border-border/30 p-2 cursor-pointer hover:bg-muted/30 transition-colors',
                        !isCurrentMonth && 'bg-muted/20',
                        index % 7 === 0 && 'border-l-0',
                        selectedDate && isSameDay(day, selectedDate) && 'bg-primary/5'
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
                      
                      {/* Task Pills */}
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              'w-full text-left px-2 py-1 rounded text-xs font-medium truncate',
                              getColorClass(task.color)
                            )}
                            title={`${task.branch}: ${task.title}`}
                          >
                            {task.title.substring(0, 18)}
                            {task.title.length > 18 && '...'}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-muted-foreground px-2">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Event title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select value={formData.branch} onValueChange={(v) => setFormData({ ...formData, branch: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskDate">Date *</Label>
                <Input
                  id="taskDate"
                  type="date"
                  value={formData.taskDate}
                  onChange={(e) => setFormData({ ...formData, taskDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-4 h-4 rounded', c.class)} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingTask ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default BranchCalendar;
