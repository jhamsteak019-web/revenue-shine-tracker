export interface SalesEntry {
  id: string;
  date: string;
  upc: string;
  name: string;
  description: string;
  qty: number;
  category: string;
  price: number;
  discountPercent: number;
  amount: number;
  branch: string;
  createdAt: string;
}

export interface ProductMaster {
  upc: string;
  name: string;
  description: string;
  category: string;
  defaultPrice: number;
}

export interface BranchSummary {
  branch: string;
  totalSales: number;
  itemsSold: number;
  uniqueProducts: number;
}

export interface CategorySummary {
  category: string;
  branches: {
    branch: string;
    totalAmount: number;
    soldCount: number;
  }[];
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface SalesFilters {
  search: string;
  dateRange: DateRange;
  branch: string;
  category: string;
}

export const BRANCHES = ['MHB', 'MLP', 'MSH', 'MUM', 'MQC'] as const;
export type Branch = typeof BRANCHES[number];

export const CATEGORIES = [
  'Electronics',
  'Groceries',
  'Clothing',
  'Home & Living',
  'Health & Beauty',
  'Sports & Outdoors',
  'Toys & Games',
  'Food & Beverages',
] as const;
export type Category = typeof CATEGORIES[number];
