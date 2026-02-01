import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PhotoGroup {
  approvedBoss: string[];
  loi: string[];
  msas: string[];
}

interface SalesPerCategory {
  MHB: number;
  MLP: number;
  MSH: number;
  MUM: number;
}

export interface ExtraAreaEntry {
  id: string;
  branch: string;
  category: string;
  locationArea: string;
  rentalRate: number;
  noFixtures: string;
  date: string;
  noDays: number;
  sales: SalesPerCategory;
  photos: PhotoGroup;
  remarks: string;
  createdAt: string;
}

export const useExtraAreaStore = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ExtraAreaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('extra_area_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedEntries: ExtraAreaEntry[] = (data || []).map((row) => ({
        id: row.id,
        branch: row.branch,
        category: row.category,
        locationArea: row.location_area,
        rentalRate: Number(row.rental_rate),
        noFixtures: row.no_fixtures || '',
        date: row.entry_date,
        noDays: row.no_days,
        sales: {
          MHB: Number(row.sales_mhb),
          MLP: Number(row.sales_mlp),
          MSH: Number(row.sales_msh),
          MUM: Number(row.sales_mum),
        },
        photos: {
          approvedBoss: row.photos_approved_boss || [],
          loi: row.photos_loi || [],
          msas: row.photos_msas || [],
        },
        remarks: row.remarks || '',
        createdAt: row.created_at,
      }));

      setEntries(mappedEntries);
      setError(null);
    } catch (err) {
      console.error('Error fetching extra area entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const uploadPhoto = async (file: File, type: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('extra-area-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('extra-area-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const deletePhoto = async (url: string) => {
    if (!user) return;

    try {
      // Extract path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/extra-area-photos/');
      if (pathParts.length > 1) {
        const filePath = decodeURIComponent(pathParts[1]);
        await supabase.storage.from('extra-area-photos').remove([filePath]);
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
    }
  };

  const addEntry = async (entry: Omit<ExtraAreaEntry, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error: insertError } = await supabase
        .from('extra_area_entries')
        .insert({
          user_id: user.id,
          branch: entry.branch,
          category: entry.category,
          location_area: entry.locationArea,
          rental_rate: entry.rentalRate,
          no_fixtures: entry.noFixtures,
          entry_date: entry.date,
          no_days: entry.noDays,
          sales_mhb: entry.sales.MHB,
          sales_mlp: entry.sales.MLP,
          sales_msh: entry.sales.MSH,
          sales_mum: entry.sales.MUM,
          photos_approved_boss: entry.photos.approvedBoss,
          photos_loi: entry.photos.loi,
          photos_msas: entry.photos.msas,
          remarks: entry.remarks,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newEntry: ExtraAreaEntry = {
        id: data.id,
        branch: data.branch,
        category: data.category,
        locationArea: data.location_area,
        rentalRate: Number(data.rental_rate),
        noFixtures: data.no_fixtures || '',
        date: data.entry_date,
        noDays: data.no_days,
        sales: {
          MHB: Number(data.sales_mhb),
          MLP: Number(data.sales_mlp),
          MSH: Number(data.sales_msh),
          MUM: Number(data.sales_mum),
        },
        photos: {
          approvedBoss: data.photos_approved_boss || [],
          loi: data.photos_loi || [],
          msas: data.photos_msas || [],
        },
        remarks: data.remarks || '',
        createdAt: data.created_at,
      };

      setEntries((prev) => [newEntry, ...prev]);
      setError(null);
      return newEntry;
    } catch (err) {
      console.error('Error adding entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    }
  };

  const updateEntry = async (id: string, entry: Omit<ExtraAreaEntry, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error: updateError } = await supabase
        .from('extra_area_entries')
        .update({
          branch: entry.branch,
          category: entry.category,
          location_area: entry.locationArea,
          rental_rate: entry.rentalRate,
          no_fixtures: entry.noFixtures,
          entry_date: entry.date,
          no_days: entry.noDays,
          sales_mhb: entry.sales.MHB,
          sales_mlp: entry.sales.MLP,
          sales_msh: entry.sales.MSH,
          sales_mum: entry.sales.MUM,
          photos_approved_boss: entry.photos.approvedBoss,
          photos_loi: entry.photos.loi,
          photos_msas: entry.photos.msas,
          remarks: entry.remarks,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedEntry: ExtraAreaEntry = {
        id: data.id,
        branch: data.branch,
        category: data.category,
        locationArea: data.location_area,
        rentalRate: Number(data.rental_rate),
        noFixtures: data.no_fixtures || '',
        date: data.entry_date,
        noDays: data.no_days,
        sales: {
          MHB: Number(data.sales_mhb),
          MLP: Number(data.sales_mlp),
          MSH: Number(data.sales_msh),
          MUM: Number(data.sales_mum),
        },
        photos: {
          approvedBoss: data.photos_approved_boss || [],
          loi: data.photos_loi || [],
          msas: data.photos_msas || [],
        },
        remarks: data.remarks || '',
        createdAt: data.created_at,
      };

      setEntries((prev) => prev.map((e) => (e.id === id ? updatedEntry : e)));
      setError(null);
      return updatedEntry;
    } catch (err) {
      console.error('Error updating entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      throw err;
    }
  };

  const removeEntry = async (id: string) => {
    if (!user) return;

    try {
      // Get entry to delete its photos
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        const allPhotos = [
          ...entry.photos.approvedBoss,
          ...entry.photos.loi,
          ...entry.photos.msas,
        ];
        await Promise.all(allPhotos.map((url) => deletePhoto(url)));
      }

      const { error: deleteError } = await supabase
        .from('extra_area_entries')
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

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    removeEntry,
    uploadPhoto,
    deletePhoto,
    refetch: fetchEntries,
  };
};
