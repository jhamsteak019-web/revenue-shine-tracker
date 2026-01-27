import { SalesEntry, ProductMaster, BRANCHES, CATEGORIES } from '@/types/sales';

export const productMasterList: ProductMaster[] = [
  { upc: '8901234567890', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with USB receiver', category: 'Electronics', defaultPrice: 599 },
  { upc: '8901234567891', name: 'USB-C Cable', description: 'Fast charging USB-C cable 1m', category: 'Electronics', defaultPrice: 299 },
  { upc: '8901234567892', name: 'Bluetooth Speaker', description: 'Portable Bluetooth speaker 10W', category: 'Electronics', defaultPrice: 1299 },
  { upc: '8901234567893', name: 'Phone Case', description: 'Protective silicone phone case', category: 'Electronics', defaultPrice: 199 },
  { upc: '8901234567894', name: 'Screen Protector', description: 'Tempered glass screen protector', category: 'Electronics', defaultPrice: 149 },
  { upc: '7501234567890', name: 'Rice Premium 5kg', description: 'Premium jasmine rice 5kg pack', category: 'Groceries', defaultPrice: 450 },
  { upc: '7501234567891', name: 'Cooking Oil 1L', description: 'Vegetable cooking oil 1 liter', category: 'Groceries', defaultPrice: 189 },
  { upc: '7501234567892', name: 'Instant Noodles Pack', description: 'Instant noodles 6-pack assorted', category: 'Groceries', defaultPrice: 120 },
  { upc: '7501234567893', name: 'Coffee 3-in-1', description: 'Instant coffee 3-in-1 20 sachets', category: 'Groceries', defaultPrice: 245 },
  { upc: '7501234567894', name: 'Canned Tuna', description: 'Tuna chunks in oil 155g', category: 'Groceries', defaultPrice: 65 },
  { upc: '6401234567890', name: 'Cotton T-Shirt', description: '100% cotton plain t-shirt', category: 'Clothing', defaultPrice: 399 },
  { upc: '6401234567891', name: 'Denim Jeans', description: 'Classic fit denim jeans', category: 'Clothing', defaultPrice: 999 },
  { upc: '6401234567892', name: 'Sports Shorts', description: 'Quick-dry sports shorts', category: 'Clothing', defaultPrice: 349 },
  { upc: '5301234567890', name: 'LED Desk Lamp', description: 'Adjustable LED desk lamp', category: 'Home & Living', defaultPrice: 599 },
  { upc: '5301234567891', name: 'Throw Pillow', description: 'Decorative throw pillow 18x18', category: 'Home & Living', defaultPrice: 249 },
  { upc: '5301234567892', name: 'Storage Box Set', description: 'Plastic storage box set of 3', category: 'Home & Living', defaultPrice: 399 },
  { upc: '4201234567890', name: 'Shampoo 400ml', description: 'Anti-dandruff shampoo 400ml', category: 'Health & Beauty', defaultPrice: 189 },
  { upc: '4201234567891', name: 'Sunscreen SPF50', description: 'Sunscreen lotion SPF50 100ml', category: 'Health & Beauty', defaultPrice: 349 },
  { upc: '4201234567892', name: 'Vitamin C 500mg', description: 'Vitamin C tablets 100 count', category: 'Health & Beauty', defaultPrice: 299 },
  { upc: '3101234567890', name: 'Yoga Mat', description: 'Non-slip yoga mat 6mm', category: 'Sports & Outdoors', defaultPrice: 599 },
  { upc: '3101234567891', name: 'Jump Rope', description: 'Adjustable speed jump rope', category: 'Sports & Outdoors', defaultPrice: 199 },
  { upc: '2001234567890', name: 'Building Blocks Set', description: 'Creative building blocks 200pcs', category: 'Toys & Games', defaultPrice: 499 },
  { upc: '2001234567891', name: 'Board Game Classic', description: 'Classic family board game', category: 'Toys & Games', defaultPrice: 399 },
  { upc: '1101234567890', name: 'Chocolate Bar Pack', description: 'Assorted chocolate bars 6-pack', category: 'Food & Beverages', defaultPrice: 180 },
  { upc: '1101234567891', name: 'Energy Drink 4-Pack', description: 'Energy drink 250ml 4-pack', category: 'Food & Beverages', defaultPrice: 220 },
];

// Generate mock sales data for the current and previous months
const generateMockSalesData = (): SalesEntry[] => {
  const entries: SalesEntry[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Generate entries for current month and previous month
  for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
    const month = currentMonth - monthOffset;
    const year = month < 0 ? currentYear - 1 : currentYear;
    const actualMonth = month < 0 ? month + 12 : month;
    
    const daysInMonth = new Date(year, actualMonth + 1, 0).getDate();
    const entriesCount = monthOffset === 0 ? 45 : 60; // More entries for previous month
    
    for (let i = 0; i < entriesCount; i++) {
      const product = productMasterList[Math.floor(Math.random() * productMasterList.length)];
      const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)];
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const qty = Math.floor(Math.random() * 10) + 1;
      const discountPercent = Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0;
      const amount = product.defaultPrice * qty * (1 - discountPercent / 100);
      
      entries.push({
        id: `entry-${monthOffset}-${i}`,
        date: `${year}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        upc: product.upc,
        name: product.name,
        description: product.description,
        qty,
        category: product.category,
        price: product.defaultPrice,
        discountPercent,
        amount: Math.round(amount * 100) / 100,
        branch,
        createdAt: new Date(year, actualMonth, day, Math.floor(Math.random() * 12) + 8).toISOString(),
      });
    }
  }
  
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockSalesData = generateMockSalesData();

export const findProductByUPC = (upc: string): ProductMaster | undefined => {
  return productMasterList.find(p => p.upc === upc);
};
