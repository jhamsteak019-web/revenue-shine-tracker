import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BranchCalendarTask {
  id: string;
  title: string;
  description: string;
  branch: string;
  taskDate: string;
  taskType: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const useBranchCalendarStore = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<BranchCalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('branch_calendar_tasks')
        .select('*')
        .order('task_date', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedTasks: BranchCalendarTask[] = (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        branch: row.branch,
        taskDate: row.task_date,
        taskType: row.task_type,
        color: row.color || 'blue',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setTasks(mappedTasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching calendar tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: Omit<BranchCalendarTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error: insertError } = await supabase
        .from('branch_calendar_tasks')
        .insert({
          user_id: user.id,
          title: task.title,
          description: task.description,
          branch: task.branch,
          task_date: task.taskDate,
          task_type: task.taskType,
          color: task.color,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newTask: BranchCalendarTask = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        branch: data.branch,
        taskDate: data.task_date,
        taskType: data.task_type,
        color: data.color || 'blue',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setTasks((prev) => [newTask, ...prev]);
      setError(null);
      return newTask;
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  };

  const updateTask = async (id: string, task: Omit<BranchCalendarTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error: updateError } = await supabase
        .from('branch_calendar_tasks')
        .update({
          title: task.title,
          description: task.description,
          branch: task.branch,
          task_date: task.taskDate,
          task_type: task.taskType,
          color: task.color,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedTask: BranchCalendarTask = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        branch: data.branch,
        taskDate: data.task_date,
        taskType: data.task_type,
        color: data.color || 'blue',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      setError(null);
      return updatedTask;
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const removeTask = async (id: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('branch_calendar_tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error removing task:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove task');
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    removeTask,
    refetch: fetchTasks,
  };
};
