import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/sales/SectionCard';
import { EmptyState } from '@/components/sales/EmptyState';
import { Package, Search, Trash2, Upload, Download, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/formatters';
import { CATEGORIES } from '@/types/sales';

interface CollectionItem {
  id: string;
  name: string;
  upc: string;
  description: string;
  category: string;
  price: number;
}

const CollectionItems: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [items, setItems] = React.useState<CollectionItem[]>([]);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CollectionItem | null>(null);
  
  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    upc: '',
    description: '',
    category: '',
    price: '',
  });

  // Filter items
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.upc.includes(searchQuery);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all items?')) {
      setItems([]);
    }
  };

  const handleAddItem = () => {
    setFormData({ name: '', upc: '', description: '', category: '', price: '' });
    setEditingItem(null);
    setAddDialogOpen(true);
  };

  const handleEditItem = (item: CollectionItem) => {
    setFormData({
      name: item.name,
      upc: item.upc,
      description: item.description,
      category: item.category,
      price: item.price.toString(),
    });
    setEditingItem(item);
    setAddDialogOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Delete this item?')) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.upc || !formData.category || !formData.price) {
      return;
    }

    if (editingItem) {
      setItems(items.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formData.name,
              upc: formData.upc,
              description: formData.description,
              category: formData.category,
              price: parseFloat(formData.price) || 0,
            }
          : item
      ));
    } else {
      const newItem: CollectionItem = {
        id: Date.now().toString(),
        name: formData.name,
        upc: formData.upc,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
      };
      setItems([...items, newItem]);
    }

    setAddDialogOpen(false);
    setFormData({ name: '', upc: '', description: '', category: '', price: '' });
    setEditingItem(null);
  };

  const uniqueCategories = React.useMemo(() => {
    return [...new Set(items.map(i => i.category))].sort();
  }, [items]);

  return (
    <MainLayout>
      <PageHeader
        title="Collection Items"
        subtitle="Manage your collection items"
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        pdfElementId="collection-items-content"
      />

      <div id="collection-items-content" className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-2"
              onClick={handleClearAll}
              disabled={items.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Import Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button size="sm" className="gap-2" onClick={handleAddItem}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                {(uniqueCategories.length > 0 ? uniqueCategories : CATEGORIES).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <SectionCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Collection Items ({filteredItems.length})
              </h3>
              <span className="text-sm text-muted-foreground">
                Showing {filteredItems.length > 0 ? '1' : '0'}-{filteredItems.length} of {filteredItems.length}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="table-header border-0">
                  <TableHead>Name</TableHead>
                  <TableHead>UPC</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="table-row">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.upc}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <p className="text-muted-foreground">
                        No items found. Add your first item to get started.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter item name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upc">UPC *</Label>
              <Input
                id="upc"
                placeholder="Enter UPC code"
                value={formData.upc}
                onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CollectionItems;
