import { SalesEntry } from '@/types/sales';
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

// Custom storage using IndexedDB for larger capacity (localStorage is only ~5MB)
const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await idbGet(name);
      return value ?? null;
    } catch (error) {
      console.error('IndexedDB getItem error:', error);
      // Fallback to localStorage
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await idbSet(name, value);
    } catch (error) {
      console.error('IndexedDB setItem error:', error);
      // Don't fallback to localStorage for large data - it will fail
      throw error;
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await idbDel(name);
    } catch (error) {
      console.error('IndexedDB removeItem error:', error);
      localStorage.removeItem(name);
    }
  },
};

interface SalesStore {
  entries: SalesEntry[];
  selectedMonth: Date;
  isImporting: boolean;
  importProgress: number;
  storageError: string | null;
  setSelectedMonth: (date: Date) => void;
  addEntry: (entry: SalesEntry) => void;
  addEntries: (entries: SalesEntry[]) => void;
  addEntriesBatch: (entries: SalesEntry[], onProgress?: (progress: number) => void) => Promise<void>;
  removeEntry: (id: string) => void;
  clearAllEntries: () => void;
  getEntriesForMonth: (date: Date) => SalesEntry[];
  getTotalSalesForMonth: (date: Date) => number;
  setImporting: (isImporting: boolean) => void;
  setStorageError: (error: string | null) => void;
}

const BATCH_SIZE = 500; // Process entries in batches for smooth UI

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      entries: [],
      selectedMonth: new Date(),
      isImporting: false,
      importProgress: 0,
      storageError: null,
      
      setSelectedMonth: (date) => set({ selectedMonth: date }),
      
      setImporting: (isImporting) => set({ isImporting, importProgress: isImporting ? 0 : 100 }),
      
      setStorageError: (error) => set({ storageError: error }),
      
      addEntry: (entry) => set((state) => ({ 
        entries: [entry, ...state.entries],
        storageError: null,
      })),
      
      addEntries: (newEntries) => set((state) => ({ 
        entries: [...newEntries, ...state.entries],
        storageError: null,
      })),
      
      // Batch import for large files - processes in chunks to keep UI responsive
      addEntriesBatch: async (newEntries, onProgress) => {
        if (newEntries.length === 0) return;
        
        set({ isImporting: true, importProgress: 0, storageError: null });
        
        const totalBatches = Math.ceil(newEntries.length / BATCH_SIZE);
        
        try {
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
        } catch (error) {
          console.error('Batch import error:', error);
          set({ 
            isImporting: false, 
            importProgress: 0,
            storageError: error instanceof Error ? error.message : 'Storage error occurred'
          });
          throw error;
        }
      },
      
      removeEntry: (id) => set((state) => ({ 
        entries: state.entries.filter(e => e.id !== id) 
      })),
      
      clearAllEntries: () => set({ entries: [], storageError: null }),
      
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
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ entries: state.entries }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate storage:', error);
        }
      },
    }
  )
);

// Migrate from localStorage to IndexedDB on first load
const migrateFromLocalStorage = async () => {
  try {
    const localData = localStorage.getItem('sales-entries-storage');
    if (localData) {
      const existingIDB = await idbGet('sales-entries-storage');
      if (!existingIDB) {
        // Migrate data to IndexedDB
        await idbSet('sales-entries-storage', localData);
        console.log('Migrated sales data from localStorage to IndexedDB');
      }
      // Clear localStorage to free up space
      localStorage.removeItem('sales-entries-storage');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migration
migrateFromLocalStorage();
