import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 50,
  className,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalItems 
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : currentPage * itemsPerPage;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      {totalItems && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
          <span className="font-medium text-foreground">{endItem}</span> of{' '}
          <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span> entries
        </p>
      )}
      
      <nav className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1 px-2.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === 'ellipsis' ? (
              <span 
                key={`ellipsis-${index}`} 
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  "h-9 w-9 p-0 font-medium",
                  currentPage === page && "bg-primary text-primary-foreground"
                )}
              >
                {page}
              </Button>
            )
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1 px-2.5"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
};
