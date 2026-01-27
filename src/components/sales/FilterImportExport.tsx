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
  onImport: (entries: SalesEntry[]) => void;
  onClearAll: () => void;
}

export const FilterImportExport: React.FC<FilterImportExportProps> = ({
  dateRange,
  onDateRangeChange,
  entries,
  onImport,
  onClearAll,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = React.useState(false);

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

    setIsImporting(true);
    try {
      const result = await importFromExcel(file);
      
      if (result.success && result.data.length > 0) {
        onImport(result.data as SalesEntry[]);
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
      toast({
        title: 'Import error',
        description: 'Failed to import file. Please check the format.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
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
    <SectionCard title="Filter & Import/Export" subtitle="Manage your sales data">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select date range
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
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
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import Excel'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          
          <Button
            variant="outline"
            onClick={generateExcelTemplate}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Template
          </Button>

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
      
      <p className="text-xs text-muted-foreground mt-3">
        Upload Excel file (max 10MB). Download template for correct column format.
      </p>
    </SectionCard>
  );
};
