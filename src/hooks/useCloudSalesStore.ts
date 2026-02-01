import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesEntry } from '@/types/sales';
import { useAuth } from '@/contexts/AuthContext';

const BATCH_SIZE = 500;

export const useCloudSalesStore = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SalesEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch entries from database
  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('sales_entries')
        .select('*')
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      // Map database fields to SalesEntry format
      const mappedEntries: SalesEntry[] = (data || []).map((row) => ({
        id: row.id,
        date: row.date,
        upc: row.upc,
        name: row.name,
        description: row.description || '',
        qty: row.qty,
        category: row.category,
        price: Number(row.price),
        discountPercent: Number(row.discount_percent),
        amount: Number(row.amount),
        branch: row.branch,
        createdAt: row.created_at,
      }));

      setEntries(mappedEntries);
      setError(null);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load entries on mount and when user changes
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Add single entry
  const addEntry = async (entry: Omit<SalesEntry, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error: insertError } = await supabase
        .from('sales_entries')
        .insert({
          user_id: user.id,
          date: entry.date,
          upc: entry.upc,
          name: entry.name,
          description: entry.description,
          qty: entry.qty,
          category: entry.category,
          price: entry.price,
          discount_percent: entry.discountPercent,
          amount: entry.amount,
          branch: entry.branch,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newEntry: SalesEntry = {
        id: data.id,
        date: data.date,
        upc: data.upc,
        name: data.name,
        description: data.description || '',
        qty: data.qty,
        category: data.category,
        price: Number(data.price),
        discountPercent: Number(data.discount_percent),
        amount: Number(data.amount),
        branch: data.branch,
        createdAt: data.created_at,
      };

      setEntries((prev) => [newEntry, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Error adding entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    }
  };

  // Add entries in batch (for Excel import)
  const addEntriesBatch = async (
    newEntries: Omit<SalesEntry, 'id' | 'createdAt'>[],
    onProgress?: (progress: number) => void
  ) => {
    if (!user || newEntries.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    const totalBatches = Math.ceil(newEntries.length / BATCH_SIZE);
    const insertedEntries: SalesEntry[] = [];

    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, newEntries.length);
        const batch = newEntries.slice(start, end);

        const { data, error: insertError } = await supabase
          .from('sales_entries')
          .insert(
            batch.map((entry) => ({
              user_id: user.id,
              date: entry.date,
              upc: entry.upc,
              name: entry.name,
              description: entry.description,
              qty: entry.qty,
              category: entry.category,
              price: entry.price,
              discount_percent: entry.discountPercent,
              amount: entry.amount,
              branch: entry.branch,
            }))
          )
          .select();

        if (insertError) throw insertError;

        const mappedBatch: SalesEntry[] = (data || []).map((row) => ({
          id: row.id,
          date: row.date,
          upc: row.upc,
          name: row.name,
          description: row.description || '',
          qty: row.qty,
          category: row.category,
          price: Number(row.price),
          discountPercent: Number(row.discount_percent),
          amount: Number(row.amount),
          branch: row.branch,
          createdAt: row.created_at,
        }));

        insertedEntries.push(...mappedBatch);

        const progress = Math.round(((i + 1) / totalBatches) * 100);
        setImportProgress(progress);
        onProgress?.(progress);
      }

      setEntries((prev) => [...insertedEntries, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Batch import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import entries');
      throw err;
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  // Remove entry
  const removeEntry = async (id: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('sales_entries')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEntries((prev) => prev.filter((e) => e.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error removing entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove entry');
      throw err;
    }
  };

  // Clear all entries for user
  const clearAllEntries = async () => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('sales_entries')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setEntries([]);
      setError(null);
    } catch (err) {
      console.error('Error clearing entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear entries');
      throw err;
    }
  };

  // Get entries for a specific month
  const getEntriesForMonth = useCallback(
    (date: Date) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      return entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === month && entryDate.getFullYear() === year;
      });
    },
    [entries]
  );

  // Get total sales for month
  const getTotalSalesForMonth = useCallback(
    (date: Date) => {
      const monthEntries = getEntriesForMonth(date);
      return monthEntries.reduce((sum, entry) => sum + entry.amount, 0);
    },
    [getEntriesForMonth]
  );

  return {
    entries,
    loading,
    isImporting,
    importProgress,
    error,
    addEntry,
    addEntriesBatch,
    removeEntry,
    clearAllEntries,
    getEntriesForMonth,
    getTotalSalesForMonth,
    refetch: fetchEntries,
  };
};
