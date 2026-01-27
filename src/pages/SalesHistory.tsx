import React from 'react';
import { DollarSign, Package, Building, ShoppingBag, Search, Filter, Calendar } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/sales/KPICard';
import { SectionCard } from '@/components/sales/SectionCard';
import { BranchPill } from '@/components/sales/BranchPill';
import { CategoryCard } from '@/components/sales/CategoryCard';
import { EmptyState } from '@/components/sales/EmptyState';
import { SalesEntryTable } from '@/components/sales/SalesEntryTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useSalesStore } from '@/hooks/useSalesStore';
import { formatCurrency, formatMonthYear } from '@/utils/formatters';
import { BRANCHES, CATEGORIES, SalesEntry } from '@/types/sales';

const SalesHistory: React.FC = () => {
  const { selectedMonth, setSelectedMonth, getEntriesForMonth } = useSalesStore();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedBranch, setSelectedBranch] = React.useState<string>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [detailDialog, setDetailDialog] = React.useState<{
    open: boolean;
    category: string;
    branch: string;
    entries: SalesEntry[];
  }>({ open: false, category: '', branch: '', entries: [] });

  const monthEntries = getEntriesForMonth(selectedMonth);

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

  // Branch summaries
  const branchSummaries = React.useMemo(() => {
    return BRANCHES.map((branch) => {
      const branchEntries = filteredEntries.filter((e) => e.branch === branch);
      return {
        branch,
        totalSales: branchEntries.reduce((sum, e) => sum + e.amount, 0),
        itemsSold: branchEntries.reduce((sum, e) => sum + e.qty, 0),
      };
    }).filter((b) => b.totalSales > 0);
  }, [filteredEntries]);

  // Category by branch summaries
  const categoryBranchSummaries = React.useMemo(() => {
    const summaries: {
      category: string;
      branch: string;
      totalAmount: number;
      soldCount: number;
      entries: SalesEntry[];
    }[] = [];

    CATEGORIES.forEach((category) => {
      BRANCHES.forEach((branch) => {
        const entries = filteredEntries.filter(
          (e) => e.category === category && e.branch === branch
        );
        if (entries.length > 0) {
          summaries.push({
            category,
            branch,
            totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
            soldCount: entries.reduce((sum, e) => sum + e.qty, 0),
            entries,
          });
        }
      });
    });

    return summaries.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredEntries]);

  const handleCategoryCardClick = (summary: typeof categoryBranchSummaries[0]) => {
    setDetailDialog({
      open: true,
      category: summary.category,
      branch: summary.branch,
      entries: summary.entries,
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
          {/* Total Sales Summary */}
          <SectionCard className="bg-gradient-to-r from-primary to-accent overflow-visible">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium mb-1">
                  Total Sales - All Categories
                </p>
                <p className="text-4xl lg:text-5xl font-bold text-primary-foreground">
                  {formatCurrency(totalSales)}
                </p>
                <p className="text-primary-foreground/70 text-sm mt-1">
                  {formatMonthYear(selectedMonth)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {branchSummaries.map((summary) => (
                  <div
                    key={summary.branch}
                    className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                  >
                    <span className="text-primary-foreground font-semibold text-sm">
                      {summary.branch}
                    </span>
                    <span className="text-primary-foreground/80 text-xs ml-2">
                      {formatCurrency(summary.totalSales)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Sales"
              value={formatCurrency(totalSales)}
              icon={DollarSign}
              iconClassName="bg-primary/10 text-primary"
            />
            <KPICard
              title="Total Items Sold"
              value={totalItemsSold.toLocaleString()}
              icon={Package}
              iconClassName="bg-accent/10 text-accent"
            />
            <KPICard
              title="Active Branches"
              value={activeBranches}
              icon={Building}
              iconClassName="bg-success/10 text-success"
            />
            <KPICard
              title="Unique Products"
              value={uniqueProducts}
              icon={ShoppingBag}
              iconClassName="bg-warning/10 text-warning"
            />
          </div>

          {/* Filters */}
          <SectionCard>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or UPC..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Branches</SelectItem>
                    {BRANCHES.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Category Cards by Branch */}
          {categoryBranchSummaries.length > 0 ? (
            <SectionCard
              title="Top Selling Items by Category"
              subtitle="Click on a card to view detailed breakdown"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryBranchSummaries.slice(0, 12).map((summary, index) => (
                  <CategoryCard
                    key={`${summary.category}-${summary.branch}-${index}`}
                    category={summary.category}
                    branch={summary.branch}
                    totalAmount={summary.totalAmount}
                    soldCount={summary.soldCount}
                    onClick={() => handleCategoryCardClick(summary)}
                  />
                ))}
              </div>
            </SectionCard>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {detailDialog.category} - {detailDialog.branch}
            </DialogTitle>
          </DialogHeader>
          <SalesEntryTable entries={detailDialog.entries} showActions={false} />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default SalesHistory;
