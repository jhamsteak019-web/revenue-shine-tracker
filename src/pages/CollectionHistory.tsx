import React from 'react';
import { Package, Search, Calendar, Building, Filter, Award, Trash2, X } from 'lucide-react';
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

const CollectionHistory: React.FC = () => {
  const { selectedMonth, setSelectedMonth, getEntriesForMonth, removeEntry, clearAllEntries } = useSalesStore();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedBranch, setSelectedBranch] = React.useState<string>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);

  const monthEntries = getEntriesForMonth(selectedMonth);

  // Fixed 4 categories only
  const ALLOWED_CATEGORIES = ['MHB', 'MLP', 'MSH', 'MUM'] as const;

  // Get unique branches from data
  const uniqueBranches = React.useMemo(() => {
    return [...new Set(monthEntries.map(e => e.branch))].sort();
  }, [monthEntries]);

  // Only show the 4 allowed categories
  const uniqueCategories = ALLOWED_CATEGORIES;

  // Filter entries based on search and filters - ONLY show allowed categories
  const filteredEntries = React.useMemo(() => {
    return monthEntries.filter((entry) => {
      // First, check if category is in allowed list
      const isAllowedCategory = ALLOWED_CATEGORIES.includes(entry.category as typeof ALLOWED_CATEGORIES[number]);
      if (!isAllowedCategory) return false;
      
      const matchesSearch =
        !searchQuery ||
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = selectedBranch === 'all' || entry.branch === selectedBranch;
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      return matchesSearch && matchesBranch && matchesCategory;
    });
  }, [monthEntries, searchQuery, selectedBranch, selectedCategory]);

  // Calculate totals
  const totalSales = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalItemsSold = filteredEntries.reduce((sum, e) => sum + e.qty, 0);

  // Category cards data - only show allowed categories
  const categoryCards = React.useMemo(() => {
    // Initialize all 4 categories with zero values
    const cardMap = new Map<string, {
      category: string;
      totalAmount: number;
      soldCount: number;
      entries: SalesEntry[];
    }>();

    // Initialize all allowed categories
    ALLOWED_CATEGORIES.forEach(cat => {
      cardMap.set(cat, {
        category: cat,
        totalAmount: 0,
        soldCount: 0,
        entries: [],
      });
    });

    // Aggregate entries by category (only if category matches allowed)
    filteredEntries.forEach((entry) => {
      if (ALLOWED_CATEGORIES.includes(entry.category as typeof ALLOWED_CATEGORIES[number])) {
        const existing = cardMap.get(entry.category)!;
        existing.totalAmount += entry.amount;
        existing.soldCount += entry.qty;
        existing.entries.push(entry);
      }
    });

    // Return all 4 categories in fixed order
    return ALLOWED_CATEGORIES.map(cat => cardMap.get(cat)!);
  }, [filteredEntries]);

  // Store breakdown for selected category
  const storeBreakdown = React.useMemo(() => {
    if (!expandedCategory) return [];
    
    const categoryEntries = filteredEntries.filter(e => e.category === expandedCategory);
    const storeMap = new Map<string, { store: string; itemsSold: number; totalQty: number; totalAmount: number }>();
    
    categoryEntries.forEach((entry) => {
      const existing = storeMap.get(entry.branch);
      if (existing) {
        existing.itemsSold += 1;
        existing.totalQty += entry.qty;
        existing.totalAmount += entry.amount;
      } else {
        storeMap.set(entry.branch, {
          store: entry.branch,
          itemsSold: 1,
          totalQty: entry.qty,
          totalAmount: entry.amount,
        });
      }
    });

    return Array.from(storeMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredEntries, expandedCategory]);

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

          {categoryCards.length > 0 ? (
            <>
              {/* Top Selling Items by Category */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Package className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">
                    Top Selling Items by Category - {formatMonthYear(selectedMonth)}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryCards.map((card) => (
                    <div
                      key={card.category}
                      onClick={() => setExpandedCategory(expandedCategory === card.category ? null : card.category)}
                      className={cn(
                        "bg-card rounded-xl p-5 card-shadow cursor-pointer card-hover animate-fade-in",
                        expandedCategory === card.category && "ring-2 ring-primary"
                      )}
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

              {/* Store Breakdown (shown when category is selected) */}
              {expandedCategory && storeBreakdown.length > 0 && (
                <div className="bg-card rounded-xl card-shadow overflow-hidden animate-fade-in">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-foreground" />
                      <h2 className="text-lg font-semibold text-foreground">
                        Store Breakdown - {expandedCategory}
                      </h2>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedCategory(null)}
                    >
                      Close
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header border-0">
                        <TableHead>Store</TableHead>
                        <TableHead className="text-center">Items Sold</TableHead>
                        <TableHead className="text-center">Total Qty</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storeBreakdown.map((store, index) => (
                        <TableRow key={store.store} className="table-row">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <Award className="h-4 w-4 text-warning" />
                              )}
                              {store.store}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{store.itemsSold}</TableCell>
                          <TableCell className="text-center">{store.totalQty}</TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(store.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

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
                      <TableCell className="text-center">{totalItemsSold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalSales)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Sold Items List */}
              <div className="bg-card rounded-xl card-shadow overflow-hidden animate-fade-in">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-foreground" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Sold Items - {formatMonthYear(selectedMonth)}
                    </h2>
                    <Badge variant="secondary">{filteredEntries.length} items</Badge>
                  </div>
                  {filteredEntries.length > 0 && (
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
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header border-0">
                        <TableHead>Date</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id} className="table-row">
                          <TableCell className="text-sm">
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {entry.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {entry.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {entry.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{entry.branch}</TableCell>
                          <TableCell className="text-center text-sm">{entry.qty}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {formatCurrency(entry.price)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                          <TableCell className="w-[50px]">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
    </MainLayout>
  );
};

export default CollectionHistory;
