import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/sales/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, ImagePlus, X, MapPin, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { TablePagination } from '@/components/ui/TablePagination';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 50;

interface PhotoGroup {
  approvedBoss: string[];
  loi: string[];
  msas: string[];
}

interface SalesPerCategory {
  MHB: number;
  MLP: number;
  MSH: number;
  MUM: number;
}

interface ExtraAreaEntry {
  id: string;
  branch: string;
  category: string;
  locationArea: string;
  rentalRate: number;
  noFixtures: number;
  date: string;
  noDays: number;
  sales: SalesPerCategory;
  photos: PhotoGroup;
  remarks: string;
  createdAt: string;
}

const STORAGE_KEY = 'extra-area-reports';

const ExtraAreaReport: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const [entries, setEntries] = React.useState<ExtraAreaEntry[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<ExtraAreaEntry | null>(null);
  const [photoGalleryOpen, setPhotoGalleryOpen] = React.useState(false);
  const [selectedEntryPhotos, setSelectedEntryPhotos] = React.useState<ExtraAreaEntry | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Form state
  const [formData, setFormData] = React.useState({
    branch: '',
    category: '',
    locationArea: '',
    rentalRate: '',
    noFixtures: '',
    date: '',
    noDays: '',
    salesMHB: '',
    salesMLP: '',
    salesMSH: '',
    salesMUM: '',
    remarks: '',
  });
  const [photos, setPhotos] = React.useState<PhotoGroup>({
    approvedBoss: [],
    loi: [],
    msas: [],
  });

  // File input refs
  const approvedBossRef = React.useRef<HTMLInputElement>(null);
  const loiRef = React.useRef<HTMLInputElement>(null);
  const msasRef = React.useRef<HTMLInputElement>(null);

  // Load from localStorage on mount (async to avoid blocking)
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Migrate old entries that don't have sales field
          const migrated = parsed.map((entry: any) => ({
            ...entry,
            date: entry.date || '',
            sales: entry.sales || { MHB: 0, MLP: 0, MSH: 0, MUM: 0 },
          }));
          setEntries(migrated);
        }
      } catch {
        // ignore parse errors
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save to localStorage whenever entries change (debounced)
  React.useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }, 300);
    return () => clearTimeout(timeout);
  }, [entries, isLoaded]);

  const resetForm = () => {
    setFormData({
      branch: '',
      category: '',
      locationArea: '',
      rentalRate: '',
      noFixtures: '',
      date: '',
      noDays: '',
      salesMHB: '',
      salesMLP: '',
      salesMSH: '',
      salesMUM: '',
      remarks: '',
    });
    setPhotos({ approvedBoss: [], loi: [], msas: [] });
    setEditingEntry(null);
  };

  const handleAddNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (entry: ExtraAreaEntry) => {
    setFormData({
      branch: entry.branch,
      category: entry.category,
      locationArea: entry.locationArea,
      rentalRate: entry.rentalRate.toString(),
      noFixtures: entry.noFixtures.toString(),
      date: entry.date || '',
      noDays: entry.noDays.toString(),
      salesMHB: (entry.sales?.MHB || 0).toString(),
      salesMLP: (entry.sales?.MLP || 0).toString(),
      salesMSH: (entry.sales?.MSH || 0).toString(),
      salesMUM: (entry.sales?.MUM || 0).toString(),
      remarks: entry.remarks,
    });
    setPhotos(entry.photos);
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this entry?')) {
      setEntries(entries.filter(e => e.id !== id));
      toast({ title: 'Entry deleted', description: 'Extra area report removed.' });
    }
  };

  const handlePhotoUpload = (type: keyof PhotoGroup, files: FileList | null) => {
    if (!files) return;
    
    const currentCount = photos[type].length;
    const remainingSlots = 3 - currentCount;
    
    if (remainingSlots <= 0) {
      toast({ title: 'Maximum photos reached', description: 'You can only upload 3 photos per category.', variant: 'destructive' });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPhotos(prev => ({
          ...prev,
          [type]: [...prev[type], base64],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (type: keyof PhotoGroup, index: number) => {
    setPhotos(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!formData.branch || !formData.category || !formData.locationArea) {
      toast({ title: 'Missing required fields', description: 'Please fill in Branch, Category, and Location/Area.', variant: 'destructive' });
      return;
    }

    const salesData: SalesPerCategory = {
      MHB: parseFloat(formData.salesMHB) || 0,
      MLP: parseFloat(formData.salesMLP) || 0,
      MSH: parseFloat(formData.salesMSH) || 0,
      MUM: parseFloat(formData.salesMUM) || 0,
    };

    if (editingEntry) {
      setEntries(entries.map(e => 
        e.id === editingEntry.id
          ? {
              ...e,
              branch: formData.branch,
              category: formData.category,
              locationArea: formData.locationArea,
              rentalRate: parseFloat(formData.rentalRate) || 0,
              noFixtures: parseInt(formData.noFixtures) || 0,
              date: formData.date,
              noDays: parseInt(formData.noDays) || 0,
              sales: salesData,
              photos,
              remarks: formData.remarks,
            }
          : e
      ));
      toast({ title: 'Entry updated', description: 'Extra area report has been updated.' });
    } else {
      const newEntry: ExtraAreaEntry = {
        id: Date.now().toString(),
        branch: formData.branch,
        category: formData.category,
        locationArea: formData.locationArea,
        rentalRate: parseFloat(formData.rentalRate) || 0,
        noFixtures: parseInt(formData.noFixtures) || 0,
        date: formData.date,
        noDays: parseInt(formData.noDays) || 0,
        sales: salesData,
        photos,
        remarks: formData.remarks,
        createdAt: new Date().toISOString(),
      };
      setEntries([...entries, newEntry]);
      toast({ title: 'Entry added', description: 'New extra area report created.' });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all entries?')) {
      setEntries([]);
      toast({ title: 'All entries cleared', description: 'All extra area reports have been removed.' });
    }
  };

  const PhotoUploadSection = ({ 
    title, 
    type, 
    inputRef 
  }: { 
    title: string; 
    type: keyof PhotoGroup; 
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title} (max 3)</Label>
      <div className="flex flex-wrap gap-2">
        {photos[type].map((photo, index) => (
          <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
            <img src={photo} alt={`${title} ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemovePhoto(type, index)}
              className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos[type].length < 3 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handlePhotoUpload(type, e.target.files)}
        className="hidden"
      />
    </div>
  );

  const getTotalPhotos = (entry: ExtraAreaEntry) => {
    return entry.photos.approvedBoss.length + entry.photos.loi.length + entry.photos.msas.length;
  };

  const handleViewPhotos = (entry: ExtraAreaEntry) => {
    setSelectedEntryPhotos(entry);
    setPhotoGalleryOpen(true);
  };

  const getTotalSales = (entry: ExtraAreaEntry) => {
    const sales = entry.sales || { MHB: 0, MLP: 0, MSH: 0, MUM: 0 };
    return sales.MHB + sales.MLP + sales.MSH + sales.MUM;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Pagination
  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  const paginatedEntries = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return entries.slice(start, start + ITEMS_PER_PAGE);
  }, [entries, currentPage]);

  return (
    <MainLayout>
      <PageHeader
        title="Extra Area Report"
        subtitle="Manage extra area rental reports"
        entryCount={entries.length}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        pdfElementId="extra-area-content"
      />

      <div id="extra-area-content" className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-2" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
              Add Report
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="gap-2"
              onClick={handleClearAll}
              disabled={entries.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>

          {/* Entries Table - Full Width Expanded Card */}
          <div className="w-full bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
            {/* Card Header */}
            <div className="px-8 py-6 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Extra Area Reports
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded
                  </p>
                </div>
              </div>
            </div>

            {entries.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border/50 hover:bg-muted/40">
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Branch</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[160px]">Location/Area</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Rental Rate</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Fixtures</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Date</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Days</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right min-w-[140px]">Sales (Total)</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center min-w-[140px]">Photos</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[140px]">Remarks</TableHead>
                      <TableHead className="py-5 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry, index) => (
                      <TableRow 
                        key={entry.id} 
                        className={cn(
                          "border-b border-border/30 transition-colors hover:bg-muted/30",
                          index % 2 === 0 ? "bg-background" : "bg-muted/10"
                        )}
                      >
                        <TableCell className="py-5 px-6 font-semibold text-foreground">
                          {entry.branch}
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border-0">
                            {entry.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-foreground/80 max-w-[200px]">
                          <span className="block truncate" title={entry.locationArea}>
                            {entry.locationArea}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-right font-semibold text-foreground">
                          {formatCurrency(entry.rentalRate)}
                        </TableCell>
                        <TableCell className="py-5 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 font-semibold text-foreground">
                            {entry.noFixtures}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-center text-sm text-foreground/80">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell className="py-5 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 font-semibold text-foreground">
                            {entry.noDays}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-right">
                          <div className="text-right">
                            <span className="font-semibold text-foreground block">
                              {formatCurrency(getTotalSales(entry))}
                            </span>
                            {getTotalSales(entry) > 0 && (
                              <span className="text-xs text-muted-foreground block mt-0.5">
                                MHB:{formatCurrency(entry.sales?.MHB || 0).replace('₱', '')} | MLP:{formatCurrency(entry.sales?.MLP || 0).replace('₱', '')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          <button 
                            type="button"
                            onClick={() => getTotalPhotos(entry) > 0 && handleViewPhotos(entry)}
                            className={cn(
                              "flex items-center justify-center gap-1.5",
                              getTotalPhotos(entry) > 0 && "cursor-pointer hover:opacity-80 transition-opacity"
                            )}
                          >
                            {entry.photos.approvedBoss.slice(0, 2).map((photo, i) => (
                              <img 
                                key={`boss-${i}`} 
                                src={photo} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover border-2 border-background shadow-sm" 
                              />
                            ))}
                            {entry.photos.loi.slice(0, 1).map((photo, i) => (
                              <img 
                                key={`loi-${i}`} 
                                src={photo} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover border-2 border-background shadow-sm" 
                              />
                            ))}
                            {getTotalPhotos(entry) > 3 && (
                              <span className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                +{getTotalPhotos(entry) - 3}
                              </span>
                            )}
                            {getTotalPhotos(entry) === 0 && (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-muted-foreground max-w-[180px]">
                          <span className="block truncate" title={entry.remarks || '-'}>
                            {entry.remarks || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => handleEdit(entry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={entries.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    className="px-6 border-t border-border/50"
                  />
                )}
              </div>
            ) : (
              <div className="p-12">
                <EmptyState
                  title="No Extra Area Reports"
                  description="Click 'Add Report' to create your first extra area report."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Report' : 'Add New Report'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Input
                  id="branch"
                  placeholder="Enter branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  placeholder="MHB, MLP, MSH, MUM..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationArea">Location/Area *</Label>
              <Input
                id="locationArea"
                placeholder="Enter location or area"
                value={formData.locationArea}
                onChange={(e) => setFormData({ ...formData, locationArea: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentalRate">Rental Rate/Charges</Label>
                <Input
                  id="rentalRate"
                  type="number"
                  placeholder="0.00"
                  value={formData.rentalRate}
                  onChange={(e) => setFormData({ ...formData, rentalRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noFixtures">No. Fixtures</Label>
                <Input
                  id="noFixtures"
                  type="number"
                  placeholder="0"
                  value={formData.noFixtures}
                  onChange={(e) => setFormData({ ...formData, noFixtures: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noDays">No. Days</Label>
                <Input
                  id="noDays"
                  type="number"
                  placeholder="0"
                  value={formData.noDays}
                  onChange={(e) => setFormData({ ...formData, noDays: e.target.value })}
                />
              </div>
            </div>

            {/* Sales per Category */}
            <div className="border-t border-border pt-4 space-y-3">
              <Label className="text-sm font-medium text-foreground">Sales per Category</Label>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="salesMHB" className="text-xs text-muted-foreground">MHB</Label>
                  <Input
                    id="salesMHB"
                    type="number"
                    placeholder="0.00"
                    value={formData.salesMHB}
                    onChange={(e) => setFormData({ ...formData, salesMHB: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salesMLP" className="text-xs text-muted-foreground">MLP</Label>
                  <Input
                    id="salesMLP"
                    type="number"
                    placeholder="0.00"
                    value={formData.salesMLP}
                    onChange={(e) => setFormData({ ...formData, salesMLP: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salesMSH" className="text-xs text-muted-foreground">MSH</Label>
                  <Input
                    id="salesMSH"
                    type="number"
                    placeholder="0.00"
                    value={formData.salesMSH}
                    onChange={(e) => setFormData({ ...formData, salesMSH: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salesMUM" className="text-xs text-muted-foreground">MUM</Label>
                  <Input
                    id="salesMUM"
                    type="number"
                    placeholder="0.00"
                    value={formData.salesMUM}
                    onChange={(e) => setFormData({ ...formData, salesMUM: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload Sections */}
            <div className="border-t border-border pt-4 space-y-4">
              <p className="text-sm font-medium text-foreground">Photo Uploads</p>
              
              <PhotoUploadSection 
                title="Approved Boss" 
                type="approvedBoss" 
                inputRef={approvedBossRef} 
              />
              
              <PhotoUploadSection 
                title="LOI" 
                type="loi" 
                inputRef={loiRef} 
              />
              
              <PhotoUploadSection 
                title="MSAS" 
                type="msas" 
                inputRef={msasRef} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter any remarks or notes..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingEntry ? 'Save Changes' : 'Add Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Modal */}
      <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" />
              Photos - {selectedEntryPhotos?.branch} ({selectedEntryPhotos?.category})
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntryPhotos && (
            <div className="space-y-6 py-4">
              {/* Approved Boss Photos */}
              {selectedEntryPhotos.photos.approvedBoss.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Approved Boss</Badge>
                    <span className="text-muted-foreground font-normal">
                      ({selectedEntryPhotos.photos.approvedBoss.length} photos)
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedEntryPhotos.photos.approvedBoss.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo} 
                          alt={`Approved Boss ${index + 1}`} 
                          className="w-full aspect-square object-cover rounded-xl border border-border shadow-sm"
                        />
                        <a 
                          href={photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-sm font-medium"
                        >
                          View Full Size
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LOI Photos */}
              {selectedEntryPhotos.photos.loi.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">LOI</Badge>
                    <span className="text-muted-foreground font-normal">
                      ({selectedEntryPhotos.photos.loi.length} photos)
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedEntryPhotos.photos.loi.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo} 
                          alt={`LOI ${index + 1}`} 
                          className="w-full aspect-square object-cover rounded-xl border border-border shadow-sm"
                        />
                        <a 
                          href={photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-sm font-medium"
                        >
                          View Full Size
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MSAS Photos */}
              {selectedEntryPhotos.photos.msas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">MSAS</Badge>
                    <span className="text-muted-foreground font-normal">
                      ({selectedEntryPhotos.photos.msas.length} photos)
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedEntryPhotos.photos.msas.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo} 
                          alt={`MSAS ${index + 1}`} 
                          className="w-full aspect-square object-cover rounded-xl border border-border shadow-sm"
                        />
                        <a 
                          href={photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-sm font-medium"
                        >
                          View Full Size
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getTotalPhotos(selectedEntryPhotos) === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No photos uploaded for this entry.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoGalleryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ExtraAreaReport;
