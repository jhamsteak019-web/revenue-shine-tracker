import { SalesEntry } from '@/types/sales';
import { create } from 'zustand';

interface SalesStore {
  entries: SalesEntry[];
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  addEntry: (entry: SalesEntry) => void;
  addEntries: (entries: SalesEntry[]) => void;
  removeEntry: (id: string) => void;
  clearAllEntries: () => void;
  getEntriesForMonth: (date: Date) => SalesEntry[];
  getTotalSalesForMonth: (date: Date) => number;
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  entries: [],
  selectedMonth: new Date(),
  
  setSelectedMonth: (date) => set({ selectedMonth: date }),
  
  addEntry: (entry) => set((state) => ({ 
    entries: [entry, ...state.entries] 
  })),
  
  addEntries: (newEntries) => set((state) => ({ 
    entries: [...newEntries, ...state.entries] 
  })),
  
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
}));
