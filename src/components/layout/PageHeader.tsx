import React from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthYearPicker } from '@/components/sales/MonthYearPicker';
import { generatePDF } from '@/utils/pdfUtils';
import { toast } from '@/hooks/use-toast';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  entryCount?: number;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  pdfElementId?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  entryCount,
  selectedMonth,
  onMonthChange,
  pdfElementId,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  const handleSavePDF = async () => {
    if (!pdfElementId) return;
    
    setIsGeneratingPDF(true);
    try {
      await generatePDF(pdfElementId, `${title.toLowerCase().replace(/\s+/g, '-')}-${selectedMonth.toISOString().slice(0, 7)}`);
      toast({
        title: 'PDF Generated',
        description: 'Your report has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="gradient-header px-6 py-8 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center lg:hidden">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
            </div>
            <p className="text-white/80 text-sm lg:text-base">
              {subtitle}
              {entryCount !== undefined && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                  {entryCount} entries
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <MonthYearPicker
              value={selectedMonth}
              onChange={onMonthChange}
            />
            {pdfElementId && (
              <Button
                onClick={handleSavePDF}
                disabled={isGeneratingPDF}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Save to PDF'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
