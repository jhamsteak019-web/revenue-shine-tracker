import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '@/components/sales/SectionCard';
import { EmptyState } from '@/components/sales/EmptyState';
import { TablePagination } from '@/components/ui/TablePagination';
import { SalesEntry } from '@/types/sales';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface SalesEntryTableProps {
  entries: SalesEntry[];
  onDelete?: (id: string) => void;
  showActions?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
}

export const SalesEntryTable: React.FC<SalesEntryTableProps> = ({
  entries,
  onDelete,
  showActions = true,
  currentPage = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  itemsPerPage = 50,
}) => {
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalQty = entries.reduce((sum, e) => sum + e.qty, 0);

  if (entries.length === 0 && totalPages <= 1) {
    return (
      <SectionCard>
        <EmptyState
          title="No Entries Found"
          description="Add a sales entry above or import data from Excel to get started."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Sales Entries"
      subtitle={`${totalItems || entries.length} entries | Total: ${formatCurrency(totalAmount)}`}
    >
      <div className="overflow-x-auto -mx-6">
        <Table>
          <TableHeader>
            <TableRow className="table-header border-0">
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">QTY</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Disc %</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Branch</TableHead>
              {showActions && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="table-row">
                <TableCell className="font-medium text-sm">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{entry.name}</p>
                    {entry.upc && (
                      <p className="text-xs text-muted-foreground">{entry.upc}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {entry.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-medium">{entry.qty}</TableCell>
                <TableCell className="text-right">{formatCurrency(entry.price)}</TableCell>
                <TableCell className="text-center">
                  {entry.discountPercent > 0 ? (
                    <Badge variant="outline" className="text-xs">
                      {entry.discountPercent}%
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {formatCurrency(entry.amount)}
                </TableCell>
                <TableCell>
                  <Badge className="bg-accent text-accent-foreground">
                    {entry.branch}
                  </Badge>
                </TableCell>
                {showActions && onDelete && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals row */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total Items: <span className="font-semibold text-foreground">{totalQty}</span>
        </div>
        <div className="text-lg font-bold text-primary">
          Total: {formatCurrency(totalAmount)}
        </div>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          className="border-t border-border mt-4"
        />
      )}
    </SectionCard>
  );
};
