import React from 'react';
import { Package, Search, Building, Filter, Award, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/sales/SectionCard';
import { EmptyState } from '@/components/sales/EmptyState';
import { TablePagination } from '@/components/ui/TablePagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSales } from '@/contexts/SalesContext';
import { formatCurrency, formatMonthYear, formatDate } from '@/utils/formatters';
import { SalesEntry } from '@/types/sales';

// Fixed 4 categories only
const ALLOWED_CATEGORIES = ['MHB', 'MLP', 'MSH', 'MUM'] as const;

const ITEMS_PER_PAGE = 50;

interface CategoryBreakdownDialog {
  open: boolean;
  category: string;
  branches: {
    branch: string;
    totalAmount: number;
    totalQty: number;
    avgPrice: number;
    avgDiscount: number;
    entries: SalesEntry[];
  }[];
  overallTotal: number;
  overallQty: number;
}

const CollectionHistory: React.FC = () => {
  const { entries, selectedMonth, setSelectedMonth, removeEntry, clearAllEntries, loading } = useSales();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedBranch, setSelectedBranch] = React.useState<string>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [categoryDialog, setCategoryDialog] = React.useState<CategoryBreakdownDialog>({
    open: false,
    category: '',
    branches: [],
    overallTotal: 0,
    overallQty: 0,
  });

  // Memoize month entries
  const monthEntries = React.useMemo(() => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    return entries.filter((entry) => {
      const d = new Date(entry.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [entries, selectedMonth]);

  // Get unique branches from data
  const uniqueBranches = React.useMemo(() => {
    return [...new Set(monthEntries.map(e => e.branch))].filter(b => b && b.trim() !== '').sort();
  }, [monthEntries]);

  // Only show the 4 allowed categories
  const uniqueCategories = ALLOWED_CATEGORIES;

  // Deferred search for smooth typing
  const deferredSearch = React.useDeferredValue(searchQuery);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  // Filter entries based on search and filters - ONLY show allowed categories
  const filteredEntries = React.useMemo(() => {
    return monthEntries.filter((entry) => {
      const isAllowedCategory = ALLOWED_CATEGORIES.includes(entry.category as typeof ALLOWED_CATEGORIES[number]);
      if (!isAllowedCategory) return false;
      
      const matchesSearch =
        !normalizedSearch ||
        entry.name.toLowerCase().includes(normalizedSearch) ||
        entry.description.toLowerCase().includes(normalizedSearch);
      const matchesBranch = selectedBranch === 'all' || entry.branch === selectedBranch;
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      return matchesSearch && matchesBranch && matchesCategory;
    });
  }, [monthEntries, normalizedSearch, selectedBranch, selectedCategory]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedBranch, selectedCategory, normalizedSearch]);

  // Aggregate entries by item code (UPC) and sort by total qty sold (highest to lowest)
  const aggregatedItems = React.useMemo(() => {
    const itemMap = new Map<string, {
      upc: string;
      name: string;
      description: string;
      category: string;
      totalQty: number;
      totalAmount: number;
      avgPrice: number;
      avgDiscount: number;
      branches: { branch: string; qty: number; amount: number }[];
      entries: SalesEntry[];
    }>();

    for (const entry of filteredEntries) {
      const existing = itemMap.get(entry.upc);
      if (existing) {
        existing.totalQty += entry.qty;
        existing.totalAmount += entry.amount;
        existing.entries.push(entry);
        
        // Update branch breakdown
        const branchEntry = existing.branches.find(b => b.branch === entry.branch);
        if (branchEntry) {
          branchEntry.qty += entry.qty;
          branchEntry.amount += entry.amount;
        } else {
          existing.branches.push({ branch: entry.branch, qty: entry.qty, amount: entry.amount });
        }
      } else {
        itemMap.set(entry.upc, {
          upc: entry.upc,
          name: entry.name,
          description: entry.description,
          category: entry.category,
          totalQty: entry.qty,
          totalAmount: entry.amount,
          avgPrice: entry.price,
          avgDiscount: entry.discountPercent,
          branches: [{ branch: entry.branch, qty: entry.qty, amount: entry.amount }],
          entries: [entry],
        });
      }
    }

    // Calculate averages and sort branches
    return Array.from(itemMap.values())
      .map(item => {
        const totalPrice = item.entries.reduce((sum, e) => sum + (e.price * e.qty), 0);
        const totalDiscount = item.entries.reduce((sum, e) => sum + e.discountPercent, 0);
        return {
          ...item,
          avgPrice: item.totalQty > 0 ? totalPrice / item.totalQty : 0,
          avgDiscount: item.entries.length > 0 ? totalDiscount / item.entries.length : 0,
          branches: item.branches.sort((a, b) => b.qty - a.qty), // Sort branches by qty
        };
      })
      .sort((a, b) => b.totalQty - a.totalQty); // Sort by total qty sold (highest to lowest)
  }, [filteredEntries]);

  // Pagination for aggregated items
  const totalPages = Math.ceil(aggregatedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return aggregatedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [aggregatedItems, currentPage]);

  // Calculate totals efficiently
  const kpis = React.useMemo(() => {
    let totalSales = 0;
    let totalItemsSold = 0;
    for (const e of filteredEntries) {
      totalSales += e.amount;
      totalItemsSold += e.qty;
    }
    return { totalSales, totalItemsSold };
  }, [filteredEntries]);

  // Category cards data - only show allowed categories (without storing entries)
  const categoryCards = React.useMemo(() => {
    const totals = new Map<string, { totalAmount: number; soldCount: number; totalPrice: number; totalDiscount: number; entryCount: number }>();
    ALLOWED_CATEGORIES.forEach((cat) => totals.set(cat, { totalAmount: 0, soldCount: 0, totalPrice: 0, totalDiscount: 0, entryCount: 0 }));

    for (const entry of filteredEntries) {
      if (!ALLOWED_CATEGORIES.includes(entry.category as typeof ALLOWED_CATEGORIES[number])) continue;
      const t = totals.get(entry.category)!;
      t.totalAmount += entry.amount;
      t.soldCount += entry.qty;
      t.totalPrice += entry.price * entry.qty;
      t.totalDiscount += entry.discountPercent;
      t.entryCount += 1;
    }

    return ALLOWED_CATEGORIES.map((cat) => {
      const t = totals.get(cat)!;
      return {
        category: cat,
        totalAmount: t.totalAmount,
        soldCount: t.soldCount,
        avgPrice: t.soldCount > 0 ? t.totalPrice / t.soldCount : 0,
        avgDiscount: t.entryCount > 0 ? t.totalDiscount / t.entryCount : 0,
      };
    });
  }, [filteredEntries]);

  // Handle category card click - compute entries on demand
  const handleCategoryCardClick = (categoryData: typeof categoryCards[number]) => {
    const categoryEntries = filteredEntries.filter((e) => e.category === categoryData.category);
    
    const branchMap = new Map<string, {
      branch: string;
      totalAmount: number;
      totalQty: number;
      totalPrice: number;
      totalDiscount: number;
      entryCount: number;
      entries: SalesEntry[];
    }>();

    categoryEntries.forEach((entry) => {
      const existing = branchMap.get(entry.branch);
      if (existing) {
        existing.totalAmount += entry.amount;
        existing.totalQty += entry.qty;
        existing.totalPrice += entry.price * entry.qty;
        existing.totalDiscount += entry.discountPercent;
        existing.entryCount += 1;
        existing.entries.push(entry);
      } else {
        branchMap.set(entry.branch, {
          branch: entry.branch,
          totalAmount: entry.amount,
          totalQty: entry.qty,
          totalPrice: entry.price * entry.qty,
          totalDiscount: entry.discountPercent,
          entryCount: 1,
          entries: [entry],
        });
      }
    });

    // Sort by highest amount and calculate averages
    const branches = Array.from(branchMap.values())
      .map(b => ({
        branch: b.branch,
        totalAmount: b.totalAmount,
        totalQty: b.totalQty,
        avgPrice: b.totalPrice / b.totalQty,
        avgDiscount: b.totalDiscount / b.entryCount,
        entries: b.entries.sort((a, c) => c.amount - a.amount),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    setCategoryDialog({
      open: true,
      category: categoryData.category,
      branches,
      overallTotal: categoryData.totalAmount,
      overallQty: categoryData.soldCount,
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all entries?')) {
      clearAllEntries();
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Delete this entry?')) {
      removeEntry(id);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Collection History"
        subtitle="View sold collections by category and branch"
        entryCount={filteredEntries.length}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        pdfElementId="collection-history-content"
      />

      <div id="collection-history-content" className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filters */}
          <div className="bg-card rounded-xl p-4 card-shadow animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by code, name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All Branches</SelectItem>
                  {uniqueBranches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {categoryCards.length > 0 ? (
            <>
              {/* Category Cards - MHB, MLP, MSH, MUM */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Package className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">
                    Collections by Category - {formatMonthYear(selectedMonth)}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryCards.map((card) => (
                    <div
                      key={card.category}
                      onClick={() => handleCategoryCardClick(card)}
                      className="bg-card rounded-xl p-5 card-shadow cursor-pointer card-hover animate-fade-in"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-foreground">{card.category}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {card.soldCount} sold
                        </Badge>
                      </div>

                      <p className="text-xl font-bold text-primary mb-3">
                        {formatCurrency(card.totalAmount)}
                      </p>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Price:</span>
                          <span className="font-medium">{formatCurrency(card.avgPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Discount:</span>
                          <span className="font-medium">{card.avgDiscount.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Qty:</span>
                          <span className="font-medium">{card.soldCount} pcs</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">
                        Click to see branch breakdown
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Summary Table */}
              <div className="bg-card rounded-xl card-shadow overflow-hidden animate-fade-in">
                <div className="p-5 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">
                    Category Summary - {formatMonthYear(selectedMonth)}
                  </h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="table-header border-0">
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Total Qty</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryCards.map((card) => (
                      <TableRow key={card.category} className="table-row">
                        <TableCell className="font-medium">{card.category}</TableCell>
                        <TableCell className="text-center">{card.soldCount}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(card.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-center">{kpis.totalItemsSold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(kpis.totalSales)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Sold Items List - Grouped by item, sorted by total qty sold */}
              <div className="bg-card rounded-xl card-shadow overflow-hidden animate-fade-in">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Top Selling Items - {formatMonthYear(selectedMonth)}
                    </h2>
                    <Badge variant="secondary">{aggregatedItems.length} items</Badge>
                    <Badge variant="outline" className="text-xs">By Qty Sold (High → Low)</Badge>
                  </div>
                  {aggregatedItems.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="gap-2"
                      onClick={handleClearAll}
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header border-0">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Total Sold</TableHead>
                        <TableHead>Branches</TableHead>
                        <TableHead className="text-right">Avg Price</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item, index) => {
                        const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                        return (
                          <TableRow key={item.upc} className="table-row">
                            <TableCell>
                              {globalIndex === 0 ? (
                                <div className="w-7 h-7 rounded-full bg-warning flex items-center justify-center">
                                  <Award className="h-4 w-4 text-warning-foreground" />
                                </div>
                              ) : globalIndex === 1 ? (
                                <div className="w-6 h-6 rounded-full bg-muted-foreground/30 flex items-center justify-center">
                                  <span className="text-foreground text-xs font-bold">2</span>
                                </div>
                              ) : globalIndex === 2 ? (
                                <div className="w-6 h-6 rounded-full bg-orange-400/30 flex items-center justify-center">
                                  <span className="text-foreground text-xs font-bold">3</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">{globalIndex + 1}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm font-medium font-mono">
                              {item.upc}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-medium">
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-lg font-bold text-primary">{item.totalQty}</span>
                              <span className="text-xs text-muted-foreground ml-1">pcs</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {item.branches.map((b) => (
                                  <Badge 
                                    key={b.branch} 
                                    variant="secondary" 
                                    className="text-xs"
                                    title={`${b.branch}: ${b.qty} pcs - ${formatCurrency(b.amount)}`}
                                  >
                                    {b.branch}: {b.qty}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(item.avgPrice)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                              {formatCurrency(item.totalAmount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={aggregatedItems.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    className="px-5 border-t border-border"
                  />
                )}
              </div>
            </>
          ) : (
            <SectionCard>
              <EmptyState
                title="No Collections Found"
                description={`No collection data available for ${formatMonthYear(selectedMonth)}. Add entries in the Daily Sales Report.`}
              />
            </SectionCard>
          )}
        </div>
      </div>

      {/* Category Branch Breakdown Dialog */}
      <Dialog
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{categoryDialog.category} - Branch Breakdown</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {categoryDialog.branches.length} branches • Sorted by highest sales
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {formatCurrency(categoryDialog.overallTotal)}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-4 space-y-4">
            {categoryDialog.branches.map((branchData, index) => (
              <div key={branchData.branch} className="bg-muted/30 rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between bg-muted/50">
                  <div className="flex items-center gap-3">
                    {index === 0 && (
                      <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                        <span className="text-warning-foreground text-xs font-bold">1</span>
                      </div>
                    )}
                    {index > 0 && (
                      <span className="w-6 text-center text-sm text-muted-foreground font-medium">{index + 1}</span>
                    )}
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-foreground">{branchData.branch}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">Qty</p>
                      <p className="font-semibold">{branchData.totalQty}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Avg Price</p>
                      <p className="font-semibold">{formatCurrency(branchData.avgPrice)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Avg Discount</p>
                      <p className="font-semibold">{branchData.avgDiscount.toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-bold text-primary">{formatCurrency(branchData.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* Branch's sold items */}
                <Table>
                  <TableHeader>
                    <TableRow className="table-header border-0">
                      <TableHead>Date</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Discount %</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchData.entries.slice(0, 50).map((entry) => (
                      <TableRow key={entry.id} className="table-row">
                        <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                        <TableCell className="text-sm font-medium">{entry.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {entry.description || '-'}
                        </TableCell>
                        <TableCell className="text-center">{entry.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.price)}</TableCell>
                        <TableCell className="text-center">{entry.discountPercent}%</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {branchData.entries.length > 50 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-3">
                          ... and {branchData.entries.length - 50} more items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {categoryDialog.branches.length} branches with {categoryDialog.category} sales
              </p>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">Overall Total: {formatCurrency(categoryDialog.overallTotal)}</p>
                <p className="text-sm text-muted-foreground">{categoryDialog.overallQty} total items sold</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CollectionHistory;
