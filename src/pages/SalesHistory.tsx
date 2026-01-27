import React from 'react';
import { TrendingUp, Package, Building, ShoppingBag, Search, Calendar, Filter, Award } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/sales/SectionCard';
import { EmptyState } from '@/components/sales/EmptyState';
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
import { useSalesStore } from '@/hooks/useSalesStore';
import { formatCurrency, formatMonthYear, formatDate } from '@/utils/formatters';
import { SalesEntry } from '@/types/sales';
import { cn } from '@/lib/utils';

const SalesHistory: React.FC = () => {
  const { selectedMonth, setSelectedMonth, getEntriesForMonth } = useSalesStore();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedBranch, setSelectedBranch] = React.useState<string>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [detailDialog, setDetailDialog] = React.useState<{
    open: boolean;
    branch: string;
    entries: SalesEntry[];
    totalAmount: number;
    topCategory: { name: string; amount: number } | null;
  }>({ open: false, branch: '', entries: [], totalAmount: 0, topCategory: null });

  const monthEntries = getEntriesForMonth(selectedMonth);

  // Get unique branches and categories from data
  const uniqueBranches = React.useMemo(() => {
    return [...new Set(monthEntries.map(e => e.branch))].sort();
  }, [monthEntries]);

  const uniqueCategories = React.useMemo(() => {
    return [...new Set(monthEntries.map(e => e.category))].sort();
  }, [monthEntries]);

  // Filter entries based on search and filters
  const filteredEntries = React.useMemo(() => {
    return monthEntries.filter((entry) => {
      const matchesSearch =
        !searchQuery ||
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.upc.includes(searchQuery);
      const matchesBranch = selectedBranch === 'all' || entry.branch === selectedBranch;
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      return matchesSearch && matchesBranch && matchesCategory;
    });
  }, [monthEntries, searchQuery, selectedBranch, selectedCategory]);

  // Calculate KPIs
  const totalSales = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalItemsSold = filteredEntries.reduce((sum, e) => sum + e.qty, 0);
  const activeBranches = new Set(filteredEntries.map((e) => e.branch)).size;
  const uniqueProducts = new Set(filteredEntries.map((e) => e.name)).size;

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

  // Branch cards with top product
  const branchCards = React.useMemo(() => {
    const cardMap = new Map<string, {
      branch: string;
      totalAmount: number;
      soldCount: number;
      topProduct: { name: string; qty: number } | null;
      entries: SalesEntry[];
    }>();

    filteredEntries.forEach((entry) => {
      const existing = cardMap.get(entry.branch);
      if (existing) {
        existing.totalAmount += entry.amount;
        existing.soldCount += entry.qty;
        existing.entries.push(entry);
      } else {
        cardMap.set(entry.branch, {
          branch: entry.branch,
          totalAmount: entry.amount,
          soldCount: entry.qty,
          topProduct: null,
          entries: [entry],
        });
      }
    });

    // Calculate top product for each branch
    cardMap.forEach((data) => {
      const productQty = new Map<string, number>();
      data.entries.forEach((e) => {
        productQty.set(e.name, (productQty.get(e.name) || 0) + e.qty);
      });
      let topProduct: { name: string; qty: number } | null = null;
      productQty.forEach((qty, name) => {
        if (!topProduct || qty > topProduct.qty) {
          topProduct = { name, qty };
        }
      });
      data.topProduct = topProduct;
    });

    return Array.from(cardMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredEntries]);

  const handleBranchCardClick = (branchData: typeof branchCards[0]) => {
    // Calculate top category for this branch
    const categoryAmounts = new Map<string, number>();
    branchData.entries.forEach((e) => {
      categoryAmounts.set(e.category, (categoryAmounts.get(e.category) || 0) + e.amount);
    });
    let topCategory: { name: string; amount: number } | null = null;
    categoryAmounts.forEach((amount, name) => {
      if (!topCategory || amount > topCategory.amount) {
        topCategory = { name, amount };
      }
    });

    setDetailDialog({
      open: true,
      branch: branchData.branch,
      entries: branchData.entries,
      totalAmount: branchData.totalAmount,
      topCategory,
    });
  };

  return (
    <MainLayout>
      <PageHeader
        title="Sales History"
        subtitle="View all sold items by branch"
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
                    {formatCurrency(totalSales)}
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
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalSales)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatMonthYear(selectedMonth)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 card-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Items Sold</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalItemsSold.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Items this month</p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 card-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Branches</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{activeBranches}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active branches</p>
                </div>
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 card-shadow animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Unique Products</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{uniqueProducts}</p>
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

              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Filter by date
              </Button>

              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full lg:w-[160px]">
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

          {/* Top Selling Items by Category */}
          {branchCards.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  Top Selling Items by Category - {formatMonthYear(selectedMonth)}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {branchCards.map((card) => (
                  <div
                    key={card.branch}
                    onClick={() => handleBranchCardClick(card)}
                    className="bg-card rounded-xl p-5 card-shadow cursor-pointer card-hover animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-foreground">{card.branch}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {card.soldCount.toLocaleString()} sold
                      </Badge>
                    </div>

                    <p className="text-lg font-semibold text-muted-foreground mb-4">
                      {formatCurrency(card.totalAmount)}
                    </p>

                    {card.topProduct && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                          <span className="text-warning-foreground text-xs font-bold">1</span>
                        </div>
                        <span className="text-sm text-muted-foreground truncate flex-1">
                          {card.topProduct.name.length > 15 
                            ? card.topProduct.name.substring(0, 15) + '...' 
                            : card.topProduct.name}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {card.topProduct.qty.toLocaleString()} pcs
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Click to see store breakdown
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <SectionCard>
              <EmptyState
                title="No Sales Found"
                description={`No sales data available for ${formatMonthYear(selectedMonth)}. Try selecting a different month or adjusting your filters.`}
              />
            </SectionCard>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{detailDialog.branch}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {detailDialog.entries.length} items • Total: {formatCurrency(detailDialog.totalAmount)}
                  </p>
                </div>
              </div>
              {detailDialog.topCategory && (
                <div className="flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-full">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Top Category: {detailDialog.topCategory.name} ({formatCurrency(detailDialog.topCategory.amount)})
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow className="table-header border-0">
                  <TableHead className="w-[100px]">DATE</TableHead>
                  <TableHead>UPC</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>DESCRIPTION</TableHead>
                  <TableHead>CATEGORY</TableHead>
                  <TableHead className="text-center">QTY</TableHead>
                  <TableHead className="text-right">PRICE</TableHead>
                  <TableHead className="text-center">DISCOUNT %</TableHead>
                  <TableHead className="text-right">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailDialog.entries.map((entry) => (
                  <TableRow key={entry.id} className="table-row">
                    <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                    <TableCell className="text-sm font-medium">{entry.upc || '-'}</TableCell>
                    <TableCell className="text-sm">{entry.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {entry.description || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{entry.category}</TableCell>
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

          <div className="flex-shrink-0 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {detailDialog.entries.length} items
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default SalesHistory;
