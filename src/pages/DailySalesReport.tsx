import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterImportExport } from '@/components/sales/FilterImportExport';
import { SalesEntryTable } from '@/components/sales/SalesEntryTable';
import { useSalesStore } from '@/hooks/useSalesStore';
import { SalesEntry, DateRange } from '@/types/sales';
import { toast } from '@/hooks/use-toast';

const DailySalesReport: React.FC = () => {
  const { 
    selectedMonth, 
    setSelectedMonth, 
    addEntriesBatch, 
    removeEntry, 
    clearAllEntries,
    getEntriesForMonth,
    isImporting,
    importProgress,
  } = useSalesStore();

  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const monthEntries = React.useMemo(() => {
    let filtered = getEntriesForMonth(selectedMonth);
    
    if (dateRange.from) {
      filtered = filtered.filter(e => new Date(e.date) >= dateRange.from!);
    }
    if (dateRange.to) {
      filtered = filtered.filter(e => new Date(e.date) <= dateRange.to!);
    }
    
    return filtered;
  }, [getEntriesForMonth, selectedMonth, dateRange]);

  const handleImport = async (importedEntries: SalesEntry[]) => {
    await addEntriesBatch(importedEntries);
  };

  const handleDelete = (id: string) => {
    removeEntry(id);
    toast({
      title: 'Entry deleted',
      description: 'Sales entry has been removed.',
    });
  };

  const handleClearAll = () => {
    clearAllEntries();
    toast({
      title: 'All entries cleared',
      description: 'All sales data has been removed.',
    });
  };

  return (
    <MainLayout>
      <PageHeader
        title="Daily Sales Report"
        subtitle="View and manage daily sales data"
        entryCount={monthEntries.length}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        pdfElementId="daily-sales-content"
      />
      
      <div id="daily-sales-content" className="flex-1 overflow-auto p-4 lg:p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <FilterImportExport
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            entries={monthEntries}
            onImport={handleImport}
            onClearAll={handleClearAll}
            isImporting={isImporting}
            importProgress={importProgress}
          />
          
          <SalesEntryTable
            entries={monthEntries}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default DailySalesReport;
