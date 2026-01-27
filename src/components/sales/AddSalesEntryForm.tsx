import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/components/sales/SectionCard';
import { SalesEntry, BRANCHES, CATEGORIES } from '@/types/sales';
import { findProductByUPC } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const salesEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  upc: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  qty: z.number().min(1, 'Quantity must be at least 1'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  discountPercent: z.number().min(0).max(100).optional(),
  branch: z.string().min(1, 'Branch is required'),
});

type SalesEntryFormData = z.infer<typeof salesEntrySchema>;

interface AddSalesEntryFormProps {
  onSave: (entry: SalesEntry) => void;
}

export const AddSalesEntryForm: React.FC<AddSalesEntryFormProps> = ({ onSave }) => {
  const form = useForm<SalesEntryFormData>({
    resolver: zodResolver(salesEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      upc: '',
      name: '',
      description: '',
      qty: 1,
      category: '',
      price: 0,
      discountPercent: 0,
      branch: '',
    },
  });

  const watchQty = form.watch('qty');
  const watchPrice = form.watch('price');
  const watchDiscount = form.watch('discountPercent') || 0;
  const computedAmount = React.useMemo(() => {
    const amount = (watchPrice || 0) * (watchQty || 0) * (1 - (watchDiscount || 0) / 100);
    return Math.round(amount * 100) / 100;
  }, [watchQty, watchPrice, watchDiscount]);

  const handleUPCChange = (upc: string) => {
    if (upc.length >= 10) {
      const product = findProductByUPC(upc);
      if (product) {
        form.setValue('name', product.name);
        form.setValue('description', product.description);
        form.setValue('category', product.category);
        form.setValue('price', product.defaultPrice);
        toast({
          title: 'Product found',
          description: `Auto-filled: ${product.name}`,
        });
      }
    }
  };

  const onSubmit = (data: SalesEntryFormData) => {
    const entry: SalesEntry = {
      id: `entry-${Date.now()}`,
      date: data.date,
      upc: data.upc || '',
      name: data.name,
      description: data.description || '',
      qty: data.qty,
      category: data.category,
      price: data.price,
      discountPercent: data.discountPercent || 0,
      amount: computedAmount,
      branch: data.branch,
      createdAt: new Date().toISOString(),
    };

    onSave(entry);
    form.reset({
      date: new Date().toISOString().split('T')[0],
      upc: '',
      name: '',
      description: '',
      qty: 1,
      category: '',
      price: 0,
      discountPercent: 0,
      branch: '',
    });
    toast({
      title: 'Entry saved',
      description: `${entry.name} added successfully.`,
    });
  };

  const handleClear = () => {
    form.reset();
  };

  return (
    <SectionCard title="Add Sales Entry" subtitle="Enter product details to add a new sale">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="upc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter UPC to auto-fill"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleUPCChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QTY *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₱) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover">
                      {BRANCHES.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-muted-foreground">Amount</FormLabel>
              <div className="h-10 flex items-center px-3 py-2 rounded-lg border border-input bg-muted/50 font-semibold text-lg text-primary">
                ₱{computedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button type="button" variant="outline" onClick={handleClear}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </SectionCard>
  );
};
