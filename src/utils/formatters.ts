export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-PH').format(num);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
  });
};

export const getMonthYearKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const parseMonthYear = (key: string): Date => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
};
