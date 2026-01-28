import * as XLSX from 'xlsx';

export interface CollectionItem {
  id: string;
  name: string;
  upc: string;
  description: string;
  category: string;
  price: number;
}

const STORAGE_KEY = 'collection-items';

// Get all collection items from localStorage
export const getCollectionItems = (): CollectionItem[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// Save collection items to localStorage
export const saveCollectionItems = (items: CollectionItem[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

// Find product by UPC from Collection Items
export const findCollectionItemByUPC = (upc: string): CollectionItem | undefined => {
  const items = getCollectionItems();
  return items.find(item => item.upc === upc);
};

// Import result interface
export interface CollectionImportResult {
  success: boolean;
  data: CollectionItem[];
  errors: string[];
}

// Import collection items from Excel
export const importCollectionItemsFromExcel = (file: File): Promise<CollectionImportResult> => {
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
        const items: CollectionItem[] = [];

        jsonData.forEach((row: any, index: number) => {
          const rowNum = index + 2; // Account for header row

          // Map column names - flexible matching
          const name = row['Name'] || row['name'] || '';
          const upc = String(row['UPC'] || row['upc'] || '');
          const description = row['Description'] || row['description'] || '';
          const category = row['Category'] || row['category'] || '';
          const price = Number(row['Price'] || row['price'] || 0);

          // Validate required fields
          if (!name) errors.push(`Row ${rowNum}: Missing name`);
          if (!upc) errors.push(`Row ${rowNum}: Missing UPC`);

          if (name && upc) {
            items.push({
              id: `import-${Date.now()}-${index}`,
              name,
              upc,
              description,
              category,
              price,
            });
          }
        });

        resolve({
          success: items.length > 0,
          data: items,
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

// Export collection items to Excel
export const exportCollectionItemsToExcel = (items: CollectionItem[], filename: string = 'collection-items') => {
  const exportData = items.map(item => ({
    Name: item.name,
    UPC: item.upc,
    Description: item.description,
    Category: item.category,
    Price: item.price,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Collection Items');

  // Auto-fit columns
  const colWidths = [
    { wch: 30 }, // Name
    { wch: 15 }, // UPC
    { wch: 25 }, // Description
    { wch: 12 }, // Category
    { wch: 10 }, // Price
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
