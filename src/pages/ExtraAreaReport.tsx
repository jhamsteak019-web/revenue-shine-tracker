import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/sales/SectionCard';
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
import { Plus, Pencil, Trash2, ImagePlus, X, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';

interface PhotoGroup {
  approvedBoss: string[];
  loi: string[];
  msas: string[];
}

interface ExtraAreaEntry {
  id: string;
  branch: string;
  category: string;
  locationArea: string;
  rentalRate: number;
  noFixtures: number;
  noDays: number;
  photos: PhotoGroup;
  remarks: string;
  createdAt: string;
}

const STORAGE_KEY = 'extra-area-reports';

const ExtraAreaReport: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());
  const [entries, setEntries] = React.useState<ExtraAreaEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<ExtraAreaEntry | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    branch: '',
    category: '',
    locationArea: '',
    rentalRate: '',
    noFixtures: '',
    noDays: '',
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

  // Save to localStorage whenever entries change
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const resetForm = () => {
    setFormData({
      branch: '',
      category: '',
      locationArea: '',
      rentalRate: '',
      noFixtures: '',
      noDays: '',
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
      noDays: entry.noDays.toString(),
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
              noDays: parseInt(formData.noDays) || 0,
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
        noDays: parseInt(formData.noDays) || 0,
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

          {/* Entries Table */}
          <SectionCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">
                  Extra Area Reports
                </h3>
                <Badge variant="secondary">{entries.length} entries</Badge>
              </div>
            </div>

            {entries.length > 0 ? (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header border-0">
                      <TableHead>Branch</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location/Area</TableHead>
                      <TableHead className="text-right">Rental Rate</TableHead>
                      <TableHead className="text-center">Fixtures</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead className="text-center">Photos</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id} className="table-row">
                        <TableCell className="font-medium">{entry.branch}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.category}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{entry.locationArea}</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.rentalRate)}</TableCell>
                        <TableCell className="text-center">{entry.noFixtures}</TableCell>
                        <TableCell className="text-center">{entry.noDays}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {entry.photos.approvedBoss.slice(0, 2).map((photo, i) => (
                              <img key={i} src={photo} alt="" className="w-8 h-8 rounded object-cover" />
                            ))}
                            {getTotalPhotos(entry) > 2 && (
                              <span className="text-xs text-muted-foreground">+{getTotalPhotos(entry) - 2}</span>
                            )}
                            {getTotalPhotos(entry) === 0 && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">
                          {entry.remarks || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEdit(entry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  title="No Extra Area Reports"
                  description="Click 'Add Report' to create your first extra area report."
                />
              </div>
            )}
          </SectionCard>
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

            <div className="grid grid-cols-3 gap-4">
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
    </MainLayout>
  );
};

export default ExtraAreaReport;
