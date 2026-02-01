import * as XLSX from 'xlsx';
import { SalesEntry } from '@/types/sales';
import { parseDayNumber, parseLooseNumber } from '@/utils/excel/parse';

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

// Extract category from product code format: 2025MCLHB5502009-13
// Position 5 (index 4) = 'M', Position 8-9 (index 7-8) = 'HB' -> Combined = 'MHB'
const extractCategoryFromProduct = (productName: string): string => {
  if (!productName || productName.length < 9) return '';
  
  const upperProduct = productName.toUpperCase().replace(/\s/g, '');
  
  // Extract from specific positions: index 4 + index 7-8
  if (upperProduct.length >= 9) {
    const char5 = upperProduct.charAt(4);  // Position 5 (M)
    const char8 = upperProduct.charAt(7);  // Position 8
    const char9 = upperProduct.charAt(8);  // Position 9
    
    const extracted = char5 + char8 + char9;
    
    // Check if extracted matches allowed categories
    if (ALLOWED_CATEGORIES.includes(extracted)) {
      return extracted;
    }
  }
  
  // Fallback: check if product starts with allowed category
  for (const cat of ALLOWED_CATEGORIES) {
    if (upperProduct.startsWith(cat)) return cat;
  }
  
  // Fallback: find any allowed category in the product name
  for (const cat of ALLOWED_CATEGORIES) {
    if (upperProduct.includes(cat)) return cat;
  }
  
  return '';
};

export const importFromExcel = async (file: File, options?: ImportOptions): Promise<ImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // Support both .xlsx and .xls formats
    const workbook = XLSX.read(data, { 
      type: 'array',
    });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['No sheets found in workbook'],
      };
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      return {
        success: false,
        data: [],
        errors: ['Could not read worksheet'],
      };
    }
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '',
      raw: false,
    }) as any[];

    const errors: string[] = [];
    const entries: Partial<SalesEntry>[] = [];

    // Get base date from options or use current date
    const baseDate = options?.dateRangeFrom || new Date();
    const baseMonth = baseDate.getMonth();
    const baseYear = baseDate.getFullYear();

    jsonData.forEach((row: any, index: number) => {
      const rowNum = index + 2; // Account for header row
      
      // Map column names based on the actual Excel format (case-insensitive)
      const name = String(row['Name'] || row['name'] || row['NAME'] || '').trim();
      const product = String(row['Product'] || row['product'] || row['PRODUCT'] || '').trim();
      const branch = String(row['Branch'] || row['branch'] || row['BRANCH'] || '').trim();
      const qtyRaw = row['Quantity'] || row['QTY'] || row['qty'] || row['QUANTITY'] || 1;
      const priceRaw = row['Price'] || row['price'] || row['PRICE'] || 0;
      const discountRaw = row['Discount'] || row['Discount %'] || row['discount'] || row['DISCOUNT'] || 0;
      const amountRaw = row['Amount'] || row['amount'] || row['AMOUNT'] || 0;

      const qtyNum = parseLooseNumber(qtyRaw);
      const priceNum = parseLooseNumber(priceRaw);
      const discountNum = parseLooseNumber(discountRaw);
      const amountNum = parseLooseNumber(amountRaw);
      const dayValue = row['Date'] || row['date'] || row['DATE'];

      // Parse day number from Date column.
      // Accepts pure numbers and values that START with a day number (e.g. "9 (EA)").
      const dayNum = parseDayNumber(dayValue);
      if (dayNum === null) {
        if (dayValue !== undefined && dayValue !== null && String(dayValue).trim() !== '') {
          errors.push(`Row ${rowNum}: Invalid Date value "${String(dayValue).trim()}" (skipped)`);
        }
        return;
      }

      // Create full date using base month/year + day from Excel
      const entryDate = new Date(baseYear, baseMonth, dayNum);
      const dateStr = entryDate.toISOString().split('T')[0];

      // Auto-detect category from NAME column (not product) for 2025 format
      // Example: "2025MCLHB5502009-13" → position 5='M', position 8-9='HB' → "MHB"
      const category = extractCategoryFromProduct(name);

      // Skip rows without essential data
      if (!name && !product && !branch) {
        return;
      }

      // Validate required fields
      if (!name) errors.push(`Row ${rowNum}: Missing name`);
      if (!product) errors.push(`Row ${rowNum}: Missing product`);
      if (!branch) errors.push(`Row ${rowNum}: Missing branch`);

      if (name && product && branch) {
        const safeQty = Number.isFinite(qtyNum) && qtyNum > 0 ? Math.round(qtyNum) : 1;
        const safePrice = Number.isFinite(priceNum) ? priceNum : 0;
        const safeDiscount = Number.isFinite(discountNum) ? discountNum : 0;

        const computedAmount = Math.round(safePrice * safeQty * (1 - safeDiscount / 100) * 100) / 100;
        const safeAmount = Number.isFinite(amountNum) && amountNum !== 0 ? amountNum : computedAmount;

        entries.push({
          id: `import-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
          date: dateStr,
          upc: '',
          name,
          description: product,
          qty: safeQty,
          category,
          price: safePrice,
          discountPercent: safeDiscount,
          amount: safeAmount,
          branch,
          createdAt: new Date().toISOString(),
        });
      }
    });

    return {
      success: entries.length > 0,
      data: entries,
      errors: errors.slice(0, 10),
    };
  } catch (error) {
    console.error('Excel import error:', error);
    return {
      success: false,
      data: [],
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
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
