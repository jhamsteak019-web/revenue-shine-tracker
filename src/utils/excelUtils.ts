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

export const importFromExcel = (file: File): Promise<ImportResult> => {
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

        jsonData.forEach((row: any, index: number) => {
          const rowNum = index + 2; // Account for header row
          
          // Map column names (flexible matching)
          const date = row['Date'] || row['date'];
          const upc = String(row['UPC'] || row['upc'] || '');
          const name = row['Product Name'] || row['Name'] || row['name'] || '';
          const description = row['Description'] || row['description'] || '';
          const qty = Number(row['Quantity'] || row['QTY'] || row['qty'] || 0);
          const category = row['Category'] || row['category'] || '';
          const price = Number(row['Unit Price'] || row['Price'] || row['price'] || 0);
          const discountPercent = Number(row['Discount %'] || row['Discount'] || row['discount'] || 0);
          const branch = row['Branch'] || row['branch'] || '';

          // Validate required fields
          if (!date) errors.push(`Row ${rowNum}: Missing date`);
          if (!name) errors.push(`Row ${rowNum}: Missing product name`);
          if (!qty || qty <= 0) errors.push(`Row ${rowNum}: Invalid quantity`);
          if (!category) errors.push(`Row ${rowNum}: Missing category`);
          if (!price || price <= 0) errors.push(`Row ${rowNum}: Invalid price`);
          if (!branch) errors.push(`Row ${rowNum}: Missing branch`);

          if (date && name && qty > 0 && category && price > 0 && branch) {
            const amount = price * qty * (1 - discountPercent / 100);
            entries.push({
              id: `import-${Date.now()}-${index}`,
              date: formatExcelDate(date),
              upc,
              name,
              description,
              qty,
              category,
              price,
              discountPercent,
              amount: Math.round(amount * 100) / 100,
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
