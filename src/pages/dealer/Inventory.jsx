import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealerAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Loader2, Package, IndianRupee, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Inventory = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    crop_type: '',
    variety: '',
    quantity_quintals: '',
    purchase_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    storage_location: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const data = await dealerAPI.getInventory();
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const payload = {
        crop_type: formData.crop_type,
        variety: formData.variety || null,
        quantity_quintals: parseFloat(formData.quantity_quintals),
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
        storage_location: formData.storage_location || null,
        notes: formData.notes || null,
      };

      await dealerAPI.addInventory(payload);
      toast.success('Item added to inventory!');

      setIsDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast.error('Failed to save inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await dealerAPI.deleteInventory(id);
      toast.success('Item deleted');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({
      crop_type: '',
      variety: '',
      quantity_quintals: '',
      purchase_price: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      storage_location: '',
      notes: '',
    });
  };

  const filteredInventory = inventory.filter((item) => {
    const crop = (item.crop_type || '').toLowerCase();
    const q = search.toLowerCase();
    return crop.includes(q);
  });

  const totalQuantity = inventory.reduce(
    (sum, item) => sum + Number(item.quantity_quintals || 0),
    0
  );
  const totalValue = inventory.reduce(
    (sum, item) =>
      sum + Number(item.quantity_quintals || 0) * Number(item.purchase_price || 0),
    0
  );

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">{t('dealer.inventory')}</h1>
            <p className="text-muted-foreground">{t('dealer.inventoryDesc')}</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="farm-gradient">
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.addToInventory')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('dealer.addToInventory')}</DialogTitle>
                <DialogDescription>{t('dealer.inventoryDesc')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crop">{t('dealer.crop')} *</Label>
                    <Input
                      id="crop"
                      value={formData.crop_type}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, crop_type: e.target.value }))
                      }
                      placeholder="e.g., Rice"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variety">{t('dealer.variety')}</Label>
                    <Input
                      id="variety"
                      value={formData.variety}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, variety: e.target.value }))
                      }
                      placeholder="e.g., Basmati"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t('dealer.quantity')} *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity_quintals}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity_quintals: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('dealer.purchasePrice')} (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.purchase_price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          purchase_price: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">{t('dealer.purchaseDate')} *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          purchase_date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t('dealer.storageLocation')}</Label>
                    <Input
                      id="location"
                      value={formData.storage_location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          storage_location: e.target.value,
                        }))
                      }
                      placeholder="e.g., Warehouse A"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('dealer.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('dealer.searchInventory')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalQuantity.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dealer.quintalsInStock')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalValue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dealer.estimatedStockValue')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredInventory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('dealer.noInventory')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle>{item.crop_type}</CardTitle>
                    {item.variety && (
                      <p className="text-sm text-muted-foreground">{item.variety}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-lg font-semibold">
                      <IndianRupee className="h-4 w-4" />
                      {Number(item.purchase_price || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Number(item.quantity_quintals || 0)} {t('dealer.quintals')}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {item.purchase_date
                        ? format(new Date(item.purchase_date), 'dd MMM yyyy')
                        : '-'}
                    </span>
                  </div>
                  {item.storage_location && (
                    <Badge variant="secondary" className="w-fit">
                      {item.storage_location}
                    </Badge>
                  )}
                  {item.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.notes}
                    </p>
                  )}
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/40"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;

