import { SalesEntry } from '@/types/sales';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SalesStore {
  entries: SalesEntry[];
  selectedMonth: Date;
  isImporting: boolean;
  importProgress: number;
  setSelectedMonth: (date: Date) => void;
  addEntry: (entry: SalesEntry) => void;
  addEntries: (entries: SalesEntry[]) => void;
  addEntriesBatch: (entries: SalesEntry[], onProgress?: (progress: number) => void) => Promise<void>;
  removeEntry: (id: string) => void;
  clearAllEntries: () => void;
  getEntriesForMonth: (date: Date) => SalesEntry[];
  getTotalSalesForMonth: (date: Date) => number;
  setImporting: (isImporting: boolean) => void;
}

const BATCH_SIZE = 500; // Process entries in batches for smooth UI

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      entries: [],
      selectedMonth: new Date(),
      isImporting: false,
      importProgress: 0,
      
      setSelectedMonth: (date) => set({ selectedMonth: date }),
      
      setImporting: (isImporting) => set({ isImporting, importProgress: isImporting ? 0 : 100 }),
      
      addEntry: (entry) => set((state) => ({ 
        entries: [entry, ...state.entries] 
      })),
      
      addEntries: (newEntries) => set((state) => ({ 
        entries: [...newEntries, ...state.entries] 
      })),
      
      // Batch import for large files - processes in chunks to keep UI responsive
      addEntriesBatch: async (newEntries, onProgress) => {
        if (newEntries.length === 0) return;
        
        set({ isImporting: true, importProgress: 0 });
        
        const totalBatches = Math.ceil(newEntries.length / BATCH_SIZE);
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, newEntries.length);
          const batch = newEntries.slice(start, end);
          
          // Add batch to entries
          set((state) => ({ 
            entries: [...batch, ...state.entries],
            importProgress: Math.round(((i + 1) / totalBatches) * 100)
          }));
          
          onProgress?.(Math.round(((i + 1) / totalBatches) * 100));
          
          // Yield to UI thread between batches
          if (i < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        set({ isImporting: false, importProgress: 100 });
      },
      
      removeEntry: (id) => set((state) => ({ 
        entries: state.entries.filter(e => e.id !== id) 
      })),
      
      clearAllEntries: () => set({ entries: [] }),
      
      getEntriesForMonth: (date) => {
        const month = date.getMonth();
        const year = date.getFullYear();
        return get().entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });
      },
      
      getTotalSalesForMonth: (date) => {
        const monthEntries = get().getEntriesForMonth(date);
        return monthEntries.reduce((sum, entry) => sum + entry.amount, 0);
      },
    }),
    {
      name: 'sales-entries-storage',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
