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
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Edit, Loader2, ClipboardList, IndianRupee, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  crop: string;
  variety: string | null;
  quantity_quintals: number;
  price_per_quintal: number;
  total_amount: number;
  status: string;
  payment_status: string;
  farmer_name: string | null;
  farmer_phone: string | null;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    crop: '',
    variety: '',
    quantity_quintals: '',
    price_per_quintal: '',
    farmer_name: '',
    farmer_phone: '',
    delivery_address: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('dealer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const quantity = parseFloat(formData.quantity_quintals);
      const price = parseFloat(formData.price_per_quintal);
      
      const orderData = {
        dealer_id: user.id,
        crop: formData.crop,
        variety: formData.variety || null,
        quantity_quintals: quantity,
        price_per_quintal: price,
        total_amount: quantity * price,
        farmer_name: formData.farmer_name || null,
        farmer_phone: formData.farmer_phone || null,
        delivery_address: formData.delivery_address || null,
        notes: formData.notes || null
      };

      if (editingOrder) {
        const { error } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', editingOrder.id);
        if (error) throw error;
        toast.success('Order updated!');
      } else {
        const { error } = await supabase
          .from('orders')
          .insert(orderData);
        if (error) throw error;
        toast.success('Order created!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      crop: order.crop,
      variety: order.variety || '',
      quantity_quintals: order.quantity_quintals.toString(),
      price_per_quintal: order.price_per_quintal.toString(),
      farmer_name: order.farmer_name || '',
      farmer_phone: order.farmer_phone || '',
      delivery_address: order.delivery_address || '',
      notes: order.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast.success('Status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePaymentStatusChange = async (id: string, payment_status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status })
        .eq('id', id);
      if (error) throw error;
      toast.success('Payment status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const resetForm = () => {
    setFormData({
      crop: '',
      variety: '',
      quantity_quintals: '',
      price_per_quintal: '',
      farmer_name: '',
      farmer_phone: '',
      delivery_address: '',
      notes: ''
    });
    setEditingOrder(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.crop.toLowerCase().includes(search.toLowerCase()) ||
      (order.farmer_name && order.farmer_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning-foreground';
      case 'confirmed': return 'bg-info/10 text-info';
      case 'in_transit': return 'bg-primary/10 text-primary';
      case 'delivered': return 'bg-success/10 text-success';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning-foreground';
      case 'partial': return 'bg-info/10 text-info';
      case 'paid': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="farm-gradient">
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.createOrder')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? t('common.edit') : t('dealer.createOrder')}</DialogTitle>
                <DialogDescription>
                  {t('dealer.ordersDesc')}
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variety">{t('dealer.variety')}</Label>
                    <Input
                      id="variety"
                      value={formData.variety}
                      onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
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
                    <Label htmlFor="price">{t('dealer.pricePerQuintal')} *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price_per_quintal}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_per_quintal: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmer_name">{t('dealer.farmerName')}</Label>
                    <Input
                      id="farmer_name"
                      value={formData.farmer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, farmer_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farmer_phone">{t('auth.phone')}</Label>
                    <Input
                      id="farmer_phone"
                      type="tel"
                      value={formData.farmer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, farmer_phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_address">{t('dealer.deliveryAddress')}</Label>
                  <Input
                    id="delivery_address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('dealer.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                      editingOrder ? t('common.edit') : t('dealer.createOrder')
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by crop or farmer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.createOrder')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{order.crop}</h3>
                        {order.variety && (
                          <span className="text-muted-foreground">({order.variety})</span>
                        )}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPaymentColor(order.payment_status)}>
                          Payment: {order.payment_status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                        <span>{order.quantity_quintals} quintals @ ₹{order.price_per_quintal}/q</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          Total: ₹{Number(order.total_amount).toLocaleString()}
                        </span>
                      </div>
                      {(order.farmer_name || order.farmer_phone || order.delivery_address) && (
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {order.farmer_name && <span>Farmer: {order.farmer_name}</span>}
                          {order.farmer_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.farmer_phone}
                            </span>
                          )}
                          {order.delivery_address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.delivery_address}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select 
                        value={order.payment_status} 
                        onValueChange={(value) => handlePaymentStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(order)}>
                        <Edit className="h-4 w-4" />
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

export default Orders;
