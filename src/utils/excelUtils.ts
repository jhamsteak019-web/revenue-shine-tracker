import * as XLSX from 'xlsx';
import { SalesEntry } from '@/types/sales';

export const exportToExcel = (data: SalesEntry[], filename: string = 'sales-data') => {
  const exportData = data.map(entry => ({
    Date: entry.date,
    UPC: entry.upc,
    'Product Name': entry.name,
    Description: entry.description,
    Quantity: entry.qty,
    Category: entry.category,
    'Unit Price': entry.price,
    'Discount %': entry.discountPercent,
    Amount: entry.amount,
    Branch: entry.branch,
    'Created At': entry.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
  
  // Auto-fit columns
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 15 }, // UPC
    { wch: 25 }, // Product Name
    { wch: 35 }, // Description
    { wch: 10 }, // Quantity
    { wch: 18 }, // Category
    { wch: 12 }, // Unit Price
    { wch: 12 }, // Discount %
    { wch: 12 }, // Amount
    { wch: 10 }, // Branch
    { wch: 20 }, // Created At
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export interface ImportResult {
  success: boolean;
  data: Partial<SalesEntry>[];
  errors: string[];
}

export interface ImportOptions {
  dateRangeFrom?: Date;
  dateRangeTo?: Date;
}

// Allowed categories only: MHB, MLP, MSH, MUM
const ALLOWED_CATEGORIES = ['MHB', 'MLP', 'MSH', 'MUM'];

// Extract category from product name prefix - only return allowed categories
const extractCategoryFromProduct = (productName: string): string => {
  if (!productName) return '';
  
  const upperProduct = productName.toUpperCase();
  
  // Only return allowed categories
  if (upperProduct.startsWith('MHB')) return 'MHB';
  if (upperProduct.startsWith('MSH')) return 'MSH';
  if (upperProduct.startsWith('MUM')) return 'MUM';
  if (upperProduct.startsWith('MLP') || upperProduct.startsWith('MLX')) return 'MLP';
  
  // For non-matching prefixes, try to find any allowed category in the product name
  for (const cat of ALLOWED_CATEGORIES) {
    if (upperProduct.includes(cat)) return cat;
  }
  
  // Default to empty - user will need to categorize manually or it won't show in Collection History
  return '';
};

export const importFromExcel = (file: File, options?: ImportOptions): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const errors: string[] = [];
        const entries: Partial<SalesEntry>[] = [];

        // Get base date from options or use current date
        const baseDate = options?.dateRangeFrom || new Date();
        const baseMonth = baseDate.getMonth();
        const baseYear = baseDate.getFullYear();

        jsonData.forEach((row: any, index: number) => {
          const rowNum = index + 2; // Account for header row
          
          // Map column names based on the actual Excel format
          const name = row['Name'] || row['name'] || '';
          const product = row['Product'] || row['product'] || '';
          const branch = row['Branch'] || row['branch'] || '';
          const qty = Number(row['Quantity'] || row['QTY'] || row['qty'] || 1);
          const price = Number(row['Price'] || row['price'] || 0);
          const discountPercent = Number(row['Discount'] || row['Discount %'] || row['discount'] || 0);
          const amount = Number(row['Amount'] || row['amount'] || 0);
          const dayValue = row['Date'] || row['date'];

          // Parse day number from Date column (can be "1", "2", or "1 (1 MLP NS)")
          let dayNum = 1;
          if (dayValue) {
            const dayStr = String(dayValue).split(' ')[0]; // Take first part before space
            const parsed = parseInt(dayStr, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
              dayNum = parsed;
            }
          }

          // Create full date using base month/year + day from Excel
          const entryDate = new Date(baseYear, baseMonth, dayNum);
          const dateStr = entryDate.toISOString().split('T')[0];

          // Auto-detect category from product name
          const category = extractCategoryFromProduct(product);

          // Validate required fields
          if (!name) errors.push(`Row ${rowNum}: Missing name`);
          if (!product) errors.push(`Row ${rowNum}: Missing product`);
          if (!branch) errors.push(`Row ${rowNum}: Missing branch`);

          if (name && product && branch) {
            entries.push({
              id: `import-${Date.now()}-${index}`,
              date: dateStr,
              upc: '', // No UPC in this format
              name,
              description: product,
              qty,
              category,
              price,
              discountPercent,
              amount: amount || Math.round(price * qty * (1 - discountPercent / 100) * 100) / 100,
              branch,
              createdAt: new Date().toISOString(),
            });
          }
        });

        resolve({
          success: entries.length > 0,
          data: entries,
          errors,
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          errors: ['Failed to parse Excel file. Please check the format.'],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['Failed to read file.'],
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

const formatExcelDate = (excelDate: any): string => {
  if (typeof excelDate === 'number') {
    // Excel date serial number
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  if (typeof excelDate === 'string') {
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  return new Date().toISOString().split('T')[0];
};

export const generateExcelTemplate = () => {
  const templateData = [
    {
      Date: '2024-01-15',
      UPC: '8901234567890',
      'Product Name': 'Sample Product',
      Description: 'Product description here',
      Quantity: 1,
      Category: 'Electronics',
      'Unit Price': 599,
      'Discount %': 0,
      Branch: 'MHB',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  XLSX.writeFile(workbook, 'sales-import-template.xlsx');
};
