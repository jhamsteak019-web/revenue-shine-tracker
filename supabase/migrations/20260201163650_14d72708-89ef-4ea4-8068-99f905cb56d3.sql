-- Create table for branch calendar tasks/activities
CREATE TABLE public.branch_calendar_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  branch TEXT NOT NULL,
  task_date DATE NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'event',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.branch_calendar_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own calendar tasks" 
ON public.branch_calendar_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar tasks" 
ON public.branch_calendar_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar tasks" 
ON public.branch_calendar_tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar tasks" 
ON public.branch_calendar_tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_branch_calendar_tasks_user_id ON public.branch_calendar_tasks(user_id);
CREATE INDEX idx_branch_calendar_tasks_date ON public.branch_calendar_tasks(task_date);
CREATE INDEX idx_branch_calendar_tasks_branch ON public.branch_calendar_tasks(branch);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_branch_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_branch_calendar_tasks_updated_at
BEFORE UPDATE ON public.branch_calendar_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_branch_calendar_updated_at();