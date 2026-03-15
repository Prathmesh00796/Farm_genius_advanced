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
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Loader2, Package, IndianRupee, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface InventoryItem {
  id: string;
  crop: string;
  variety: string | null;
  quantity_quintals: number;
  purchase_price: number;
  purchase_date: string;
  farmer_name: string | null;
  notes: string | null;
  created_at: string;
}

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    crop: '',
    variety: '',
    quantity_quintals: '',
    purchase_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    farmer_name: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('dealer_inventory')
        .select('*')
        .eq('dealer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const itemData = {
        dealer_id: user.id,
        crop: formData.crop,
        variety: formData.variety || null,
        quantity_quintals: parseFloat(formData.quantity_quintals),
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
        farmer_name: formData.farmer_name || null,
        notes: formData.notes || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('dealer_inventory')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Inventory updated!');
      } else {
        const { error } = await supabase
          .from('dealer_inventory')
          .insert(itemData);
        if (error) throw error;
        toast.success('Item added to inventory!');
      }

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

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      crop: item.crop,
      variety: item.variety || '',
      quantity_quintals: item.quantity_quintals.toString(),
      purchase_price: item.purchase_price.toString(),
      purchase_date: item.purchase_date,
      farmer_name: item.farmer_name || '',
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('dealer_inventory')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Item deleted');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({
      crop: '',
      variety: '',
      quantity_quintals: '',
      purchase_price: '',
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      farmer_name: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const filteredInventory = inventory.filter(item =>
    item.crop.toLowerCase().includes(search.toLowerCase()) ||
    (item.farmer_name && item.farmer_name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalQuantity = inventory.reduce((sum, item) => sum + Number(item.quantity_quintals), 0);
  const totalValue = inventory.reduce((sum, item) => sum + (Number(item.quantity_quintals) * Number(item.purchase_price)), 0);

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">{t('dealer.inventory')}</h1>
            <p className="text-muted-foreground">{t('dealer.inventoryDesc')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="farm-gradient">
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.addToInventory')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? t('common.edit') : t('dealer.addToInventory')}</DialogTitle>
                <DialogDescription>
                  {t('dealer.inventoryDesc')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crop">{t('dealer.crop')} *</Label>
                    <Input
                      id="crop"
                      value={formData.crop}
                      onChange={(e) => setFormData(prev => ({ ...prev, crop: e.target.value }))}
                      placeholder="e.g., Rice"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variety">{t('dealer.variety')}</Label>
                    <Input
                      id="variety"
                      value={formData.variety}
                      onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity_quintals: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farmer">{t('dealer.farmerName')}</Label>
                    <Input
                      id="farmer"
                      value={formData.farmer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, farmer_name: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('dealer.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('dealer.notes')}
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      editingItem ? t('common.edit') : t('dealer.addToInventory')
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalQuantity.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Quintals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by crop or farmer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Inventory List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredInventory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('dealer.noInventory')}</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.addToInventory')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInventory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{item.crop}</h3>
                        {item.variety && (
                          <Badge variant="secondary">{item.variety}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {item.quantity_quintals} quintals
                        </span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          ₹{item.purchase_price}/quintal
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(item.purchase_date), 'dd MMM yyyy')}
                        </span>
                        {item.farmer_name && (
                          <span>From: {item.farmer_name}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-primary mt-2">
                        Total: ₹{(Number(item.quantity_quintals) * Number(item.purchase_price)).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
