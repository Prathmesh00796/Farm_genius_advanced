import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealerAPI } from '@/lib/api';
import {
  Plus,
  Search,
  Edit,
  Loader2,
  ClipboardList,
  IndianRupee,
  Phone,
  MapPin,
} from 'lucide-react';

const Orders = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    crop_type: '',
    variety: '',
    quantity_quintals: '',
    price_per_quintal: '',
    farmer_name: '',
    farmer_village: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data = await dealerAPI.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const quantity = parseFloat(formData.quantity_quintals);
      const price = parseFloat(formData.price_per_quintal);

      const payload = {
        crop_type: formData.crop_type,
        variety: formData.variety || null,
        quantity_quintals: quantity,
        price_per_quintal: price,
        farmer_name: formData.farmer_name || null,
        farmer_village: formData.farmer_village || null,
        notes: formData.notes || null,
      };

      if (editingOrder) {
        // Only status updates are supported by the API; for simplicity, treat edit as new order
        await dealerAPI.createOrder(payload);
      } else {
        await dealerAPI.createOrder(payload);
      }

      setIsDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      crop_type: order.crop_type,
      variety: order.variety || '',
      quantity_quintals: String(order.quantity_quintals || ''),
      price_per_quintal: String(order.price_per_quintal || ''),
      farmer_name: order.farmer_name || '',
      farmer_village: order.farmer_village || '',
      notes: order.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await dealerAPI.updateOrderStatus(id, status);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      crop_type: '',
      variety: '',
      quantity_quintals: '',
      price_per_quintal: '',
      farmer_name: '',
      farmer_village: '',
      notes: '',
    });
    setEditingOrder(null);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.crop_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.farmer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning-foreground';
      case 'confirmed':
        return 'bg-info/10 text-info';
      case 'in_transit':
        return 'bg-primary/10 text-primary';
      case 'delivered':
        return 'bg-success/10 text-success';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">{t('dealer.orders')}</h1>
            <p className="text-muted-foreground">{t('dealer.ordersDesc')}</p>
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
                {t('dealer.createOrder')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrder ? t('common.edit') : t('dealer.createOrder')}
                </DialogTitle>
                <DialogDescription>{t('dealer.ordersDesc')}</DialogDescription>
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
                    <Label htmlFor="price">{t('dealer.pricePerQuintal')} (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price_per_quintal}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price_per_quintal: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmerName">{t('dealer.farmerName')}</Label>
                    <Input
                      id="farmerName"
                      value={formData.farmer_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          farmer_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="village">{t('dealer.farmerVillage')}</Label>
                    <Input
                      id="village"
                      value={formData.farmer_village}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          farmer_village: e.target.value,
                        }))
                      }
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

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dealer.searchOrders')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder={t('dealer.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dealer.allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('dealer.pending')}</SelectItem>
              <SelectItem value="confirmed">{t('dealer.confirmed')}</SelectItem>
              <SelectItem value="in_transit">{t('dealer.inTransit')}</SelectItem>
              <SelectItem value="delivered">{t('dealer.delivered')}</SelectItem>
              <SelectItem value="cancelled">{t('dealer.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('dealer.noOrders')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {order.crop_type}{' '}
                          {order.variety && (
                            <span className="text-sm text-muted-foreground">
                              ({order.variety})
                            </span>
                          )}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      {order.farmer_name && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{order.farmer_name}</span>
                        </div>
                      )}
                      {order.farmer_village && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{order.farmer_village}</span>
                        </div>
                      )}
                      {order.notes && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {order.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center justify-end gap-1 text-lg font-semibold">
                        <IndianRupee className="h-4 w-4" />
                        {Number(order.total_amount || 0).toFixed(0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Number(order.quantity_quintals || 0)} x{' '}
                        <IndianRupee className="inline h-3 w-3" />{' '}
                        {Number(order.price_per_quintal || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {t('common.edit')}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(
                        (status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={order.status === status ? 'default' : 'outline'}
                            className={
                              order.status === status
                                ? ''
                                : 'text-xs px-2 py-1 h-7 text-muted-foreground'
                            }
                            onClick={() => handleStatusChange(order.id, status)}
                          >
                            {t(`dealer.status.${status}`)}
                          </Button>
                        )
                      )}
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

export default Orders;

