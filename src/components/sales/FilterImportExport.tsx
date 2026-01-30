import React from 'react';
import { Upload, Download, Trash2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from '@/types/sales';
import { SectionCard } from '@/components/sales/SectionCard';
import { exportToExcel, importFromExcel, generateExcelTemplate } from '@/utils/excelUtils';
import { SalesEntry } from '@/types/sales';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FilterImportExportProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  entries: SalesEntry[];
  onImport: (entries: SalesEntry[]) => Promise<void>;
  onClearAll: () => void;
  isImporting?: boolean;
  importProgress?: number;
}

export const FilterImportExport: React.FC<FilterImportExportProps> = ({
  dateRange,
  onDateRangeChange,
  entries,
  onImport,
  onClearAll,
  isImporting: externalIsImporting = false,
  importProgress = 0,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);
  const [importCalendarOpen, setImportCalendarOpen] = React.useState(false);
  
  const isImporting = externalIsImporting || isProcessingFile;

  const handleImportClick = () => {
    // Open the calendar popover when Import Excel is clicked
    setImportCalendarOpen(true);
  };

  const handleDateSelectAndImport = () => {
    if (!dateRange.from) {
      toast({
        title: 'Please select a date',
        description: 'Select at least a start date for the import.',
        variant: 'destructive',
      });
      return;
    }
    setImportCalendarOpen(false);
    // Trigger file input after date is selected
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingFile(true);
    try {
      const result = await importFromExcel(file, {
        dateRangeFrom: dateRange.from,
        dateRangeTo: dateRange.to,
      });
      
      if (result.success && result.data.length > 0) {
        // Use async import for smooth UI
        await onImport(result.data as SalesEntry[]);
        toast({
          title: 'Import successful',
          description: `${result.data.length} entries imported.${result.errors.length > 0 ? ` ${result.errors.length} rows had issues.` : ''}`,
        });
      } else {
        toast({
          title: 'Import failed',
          description: result.errors[0] || 'No valid entries found.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import error',
        description: error instanceof Error ? error.message : 'Failed to import file. Please check the format.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = () => {
    if (entries.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Add some entries first.',
        variant: 'destructive',
      });
      return;
    }
    exportToExcel(entries, `sales-data-${format(new Date(), 'yyyy-MM-dd')}`);
    toast({
      title: 'Export successful',
      description: `${entries.length} entries exported to Excel.`,
    });
  };

  return (
    <SectionCard className="p-0">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="h-5 w-5 text-foreground" />
          <h3 className="font-semibold text-foreground">Filter & Import/Export</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Import Button with Calendar Popover */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Popover open={importCalendarOpen} onOpenChange={setImportCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                onClick={handleImportClick}
                disabled={isImporting}
                className="gap-2 min-w-[140px]"
              >
                <Upload className="h-4 w-4" />
                {isImporting 
                  ? `Importing... ${importProgress}%` 
                  : 'Import Excel'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="start">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">Select Month for Import</p>
                <p className="text-xs text-muted-foreground">The day numbers from Excel will be combined with this month/year.</p>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from || new Date()}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
                numberOfMonths={1}
                className="p-3 pointer-events-auto"
              />
              <div className="p-3 border-t border-border flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setImportCalendarOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleDateSelectAndImport} disabled={!dateRange.from}>
                  Continue to Import
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Upload info text */}
          <span className="text-sm text-muted-foreground">
            Upload Excel file (max 10MB)
          </span>
          
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>

          {/* Clear All Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={entries.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all entries?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All {entries.length} sales entries will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </SectionCard>
  );
};
