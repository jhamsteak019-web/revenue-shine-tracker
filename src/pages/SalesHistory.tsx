import React from 'react';
import { TrendingUp, Package, Building, ShoppingBag, Search, Calendar, Filter, Award, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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
    dailyBreakdown: { date: string; amount: number; qty: number }[];
    entries: SalesEntry[];
  }[];
  overallTotal: number;
  overallQty: number;
}

const SalesHistory: React.FC = () => {
  const { entries, selectedMonth, setSelectedMonth, loading } = useSales();
  
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

  const monthEntries = React.useMemo(() => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    return entries.filter((entry) => {
      const d = new Date(entry.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [entries, selectedMonth]);

  const deferredSearch = React.useDeferredValue(searchQuery);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  // Get unique branches from data
  const uniqueBranches = React.useMemo(() => {
    return [...new Set(monthEntries.map(e => e.branch))].filter(b => b && b.trim() !== '').sort();
  }, [monthEntries]);

  // Filter entries based on search and filters - only allowed categories
  const filteredEntries = React.useMemo(() => {
    return monthEntries.filter((entry) => {
      const isAllowedCategory = ALLOWED_CATEGORIES.includes(entry.category as typeof ALLOWED_CATEGORIES[number]);
      if (!isAllowedCategory) return false;
      
      const matchesSearch =
        !normalizedSearch ||
        entry.name.toLowerCase().includes(normalizedSearch) ||
        entry.upc.includes(normalizedSearch);
      const matchesBranch = selectedBranch === 'all' || entry.branch === selectedBranch;
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      return matchesSearch && matchesBranch && matchesCategory;
    });
  }, [monthEntries, normalizedSearch, selectedBranch, selectedCategory]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedBranch, selectedCategory, normalizedSearch]);

  const kpis = React.useMemo(() => {
    let totalSales = 0;
    let totalItemsSold = 0;
    const branches = new Set<string>();
    const products = new Set<string>();

    for (const e of filteredEntries) {
      totalSales += e.amount;
      totalItemsSold += e.qty;
      if (e.branch) branches.add(e.branch);
      if (e.name) products.add(e.name);
    }

    return {
      totalSales,
      totalItemsSold,
      activeBranches: branches.size,
      uniqueProducts: products.size,
    };
  }, [filteredEntries]);

  // Branch summaries for pills
  const branchSummaries = React.useMemo(() => {
    const summaryMap = new Map<string, number>();
    filteredEntries.forEach((e) => {
      summaryMap.set(e.branch, (summaryMap.get(e.branch) || 0) + e.amount);
    });
    return Array.from(summaryMap.entries())
      .map(([branch, totalSales]) => ({ branch, totalSales }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [filteredEntries]);

  // Category cards data - only show allowed categories
  const categoryCards = React.useMemo(() => {
    const totals = new Map<string, { totalAmount: number; soldCount: number }>();
    ALLOWED_CATEGORIES.forEach((cat) => totals.set(cat, { totalAmount: 0, soldCount: 0 }));

    for (const entry of filteredEntries) {
      if (!ALLOWED_CATEGORIES.includes(entry.category as typeof ALLOWED_CATEGORIES[number])) continue;
      const t = totals.get(entry.category)!
      t.totalAmount += entry.amount;
      t.soldCount += entry.qty;
    }

    return ALLOWED_CATEGORIES.map((cat) => ({
      category: cat,
      totalAmount: totals.get(cat)!.totalAmount,
      soldCount: totals.get(cat)!.soldCount,
    }));
  }, [filteredEntries]);

  // Handle category card click - show branch breakdown with daily sales
  const handleCategoryCardClick = (categoryData: typeof categoryCards[number]) => {
    const categoryEntries = filteredEntries.filter((e) => e.category === categoryData.category);
    const branchMap = new Map<string, {
      branch: string;
      totalAmount: number;
      totalQty: number;
      dailyBreakdown: Map<string, { date: string; amount: number; qty: number }>;
      entries: SalesEntry[];
    }>();

    categoryEntries.forEach((entry) => {
      const existing = branchMap.get(entry.branch);
      if (existing) {
        existing.totalAmount += entry.amount;
        existing.totalQty += entry.qty;
        existing.entries.push(entry);
        
        // Daily breakdown
        const dailyEntry = existing.dailyBreakdown.get(entry.date);
        if (dailyEntry) {
          dailyEntry.amount += entry.amount;
          dailyEntry.qty += entry.qty;
        } else {
          existing.dailyBreakdown.set(entry.date, {
            date: entry.date,
            amount: entry.amount,
            qty: entry.qty,
          });
        }
      } else {
        const dailyBreakdown = new Map<string, { date: string; amount: number; qty: number }>();
        dailyBreakdown.set(entry.date, {
          date: entry.date,
          amount: entry.amount,
          qty: entry.qty,
        });
        branchMap.set(entry.branch, {
          branch: entry.branch,
          totalAmount: entry.amount,
          totalQty: entry.qty,
          dailyBreakdown,
          entries: [entry],
        });
      }
    });

    const branches = Array.from(branchMap.values())
      .map(b => ({
        ...b,
        dailyBreakdown: Array.from(b.dailyBreakdown.values()).sort((a, b) => a.date.localeCompare(b.date)),
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

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  return (
    <MainLayout>
      <PageHeader
        title="Sales History"
        subtitle="View all sold items by category and branch"
        entryCount={filteredEntries.length}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        pdfElementId="sales-history-content"
      />

      <div id="sales-history-content" className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Total Sales Summary Card */}
          <div className="bg-card rounded-xl card-shadow p-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Sales - All Categories
                  </p>
                  <p className="text-3xl lg:text-4xl font-bold text-foreground">
                    {formatCurrency(kpis.totalSales)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatMonthYear(selectedMonth)}
                  </p>
                </div>
              </div>

              {/* Branch Pills */}
              <div className="flex flex-wrap gap-2">
                {branchSummaries.slice(0, 4).map((summary) => (
                  <div
                    key={summary.branch}
                    className="bg-muted rounded-lg px-4 py-3 text-center min-w-[120px]"
                  >
                    <p className="text-xs text-muted-foreground font-medium">{summary.branch}</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(summary.totalSales)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-5 card-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Sales</p>
                   <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(kpis.totalSales)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatMonthYear(selectedMonth)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 card-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Items Sold</p>
                   <p className="text-2xl font-bold text-foreground mt-1">{kpis.totalItemsSold.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Items this month</p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 card-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Branches</p>
                   <p className="text-2xl font-bold text-foreground mt-1">{kpis.activeBranches}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active branches</p>
                </div>
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 card-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Unique Products</p>
                   <p className="text-2xl font-bold text-foreground mt-1">{kpis.uniqueProducts}</p>
                  <p className="text-xs text-muted-foreground mt-1">Different items sold</p>
                </div>
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-xl p-4 card-shadow animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                    placeholder="Search by name, UPC..."
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
                  {ALLOWED_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Cards - MHB, MLP, MSH, MUM */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5" />
              <h2 className="text-lg font-semibold">
                Sales by Category - {formatMonthYear(selectedMonth)}
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

                  <p className="text-lg font-semibold text-muted-foreground mb-4">
                    {formatCurrency(card.totalAmount)}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                      <span className="text-warning-foreground text-xs font-bold">1</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {card.soldCount} pcs
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Click to see store breakdown
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

          {/* Sold Items List */}
          {filteredEntries.length > 0 ? (
            <div className="bg-card rounded-xl card-shadow overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Sold Items - {formatMonthYear(selectedMonth)}
                  </h2>
                  <Badge variant="secondary">{filteredEntries.length} items</Badge>
                </div>
              </div>
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header border-0">
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Discount %</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry) => (
                      <TableRow key={entry.id} className="table-row">
                        <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                        <TableCell className="text-sm font-medium">{entry.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {entry.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {entry.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{entry.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.price)}</TableCell>
                        <TableCell className="text-center">{entry.discountPercent}%</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredEntries.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  className="px-5 border-t border-border"
                />
              )}
            </div>
          ) : (
            <SectionCard>
              <EmptyState
                title="No Sales Found"
                description={`No sales data available for ${formatMonthYear(selectedMonth)}. Try selecting a different month or importing sales data.`}
              />
            </SectionCard>
          )}
        </div>
      </div>

      {/* Category Breakdown Dialog */}
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
                  <DialogTitle className="text-xl">{categoryDialog.category} - Store Breakdown</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {categoryDialog.branches.length} branches • Total: {formatCurrency(categoryDialog.overallTotal)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {categoryDialog.overallQty} pcs sold
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-4 space-y-6">
            {categoryDialog.branches.map((branchData, index) => (
              <div key={branchData.branch} className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {index === 0 && (
                      <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                        <span className="text-warning-foreground text-xs font-bold">1</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-foreground">{branchData.branch}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(branchData.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{branchData.totalQty} pcs</p>
                  </div>
                </div>

                {/* Daily Breakdown Table */}
                <Table>
                  <TableHeader>
                    <TableRow className="table-header border-0">
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchData.dailyBreakdown.map((day) => (
                      <TableRow key={day.date} className="table-row">
                        <TableCell className="text-sm">{formatDate(day.date)}</TableCell>
                        <TableCell className="text-center">{day.qty}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(day.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {categoryDialog.branches.length} branches with sales in {categoryDialog.category}
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

export default SalesHistory;
