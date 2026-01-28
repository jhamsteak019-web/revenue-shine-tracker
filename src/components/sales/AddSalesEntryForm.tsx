import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Plus, Calendar } from 'lucide-react';
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
import { SectionCard } from '@/components/sales/SectionCard';
import { SalesEntry } from '@/types/sales';
import { findCollectionItemByUPC } from '@/utils/collectionItemsUtils';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const salesEntrySchema = z.object({
  date: z.date(),
  upc: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  qty: z.number().min(1, 'Quantity must be at least 1'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
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
      date: new Date(),
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
      const product = findCollectionItemByUPC(upc);
      if (product) {
        form.setValue('name', product.name);
        form.setValue('description', product.description);
        form.setValue('category', product.category);
        form.setValue('price', product.price);
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
      date: format(data.date, 'yyyy-MM-dd'),
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
      date: new Date(),
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
    <SectionCard className="p-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Header Row: Title, UPC, Branch */}
          <div className="p-4 border-b border-border flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-foreground" />
              <h3 className="font-semibold text-foreground">Add Sales Entry</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">UPC:</span>
              <FormField
                control={form.control}
                name="upc"
                render={({ field }) => (
                  <FormItem className="flex-1 lg:w-[240px]">
                    <FormControl>
                      <Input
                        placeholder="Enter UPC to auto-fill"
                        className="h-9"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleUPCChange(e.target.value);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Branch:</span>
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem className="lg:w-[180px]">
                    <FormControl>
                      <Input
                        placeholder="Enter branch"
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Form Fields Row */}
          <div className="p-4">
            {/* Labels Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Date</span>
              <span className="text-sm font-medium text-muted-foreground">Name</span>
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <span className="text-sm font-medium text-muted-foreground">QTY</span>
              <span className="text-sm font-medium text-muted-foreground">Category</span>
              <span className="text-sm font-medium text-muted-foreground">Price</span>
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <span className="text-sm font-medium text-muted-foreground">Discount %</span>
              <span className="text-sm font-medium text-muted-foreground"></span>
            </div>

            {/* Inputs Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 items-start">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full h-10 pl-3 text-left font-normal justify-start',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'MMM dd, yyyy') : 'Pick date'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
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
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
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
                    <FormControl>
                      <Input placeholder="Category" {...field} />
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
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="h-10 flex items-center px-3 rounded-md border border-input bg-muted/50 text-sm font-medium">
                {computedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>

              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Auto"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </SectionCard>
  );
};
