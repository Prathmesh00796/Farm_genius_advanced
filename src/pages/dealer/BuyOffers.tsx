import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Plus, Search, Edit, Trash2, Loader2, IndianRupee, MapPin } from 'lucide-react';

interface BuyOffer {
  id: string;
  crop: string;
  variety: string | null;
  quantity_quintals: number;
  price_per_quintal: number;
  location: string;
  description: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
}

const BuyOffers: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<BuyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BuyOffer | null>(null);
  const [formData, setFormData] = useState({
    crop: '',
    variety: '',
    quantity_quintals: '',
    price_per_quintal: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('buy_offers')
        .select('*')
        .eq('dealer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const offerData = {
        dealer_id: user.id,
        crop: formData.crop,
        variety: formData.variety || null,
        quantity_quintals: parseFloat(formData.quantity_quintals),
        price_per_quintal: parseFloat(formData.price_per_quintal),
        location: formData.location,
        description: formData.description || null,
        status: 'active'
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('buy_offers')
          .update(offerData)
          .eq('id', editingOffer.id);
        if (error) throw error;
        toast.success('Offer updated successfully!');
      } else {
        const { error } = await supabase
          .from('buy_offers')
          .insert(offerData);
        if (error) throw error;
        toast.success('Offer created successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (offer: BuyOffer) => {
    setEditingOffer(offer);
    setFormData({
      crop: offer.crop,
      variety: offer.variety || '',
      quantity_quintals: offer.quantity_quintals.toString(),
      price_per_quintal: offer.price_per_quintal.toString(),
      location: offer.location,
      description: offer.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const { error } = await supabase
        .from('buy_offers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Offer deleted');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('buy_offers')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast.success('Status updated');
      fetchOffers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      crop: '',
      variety: '',
      quantity_quintals: '',
      price_per_quintal: '',
      location: '',
      description: ''
    });
    setEditingOffer(null);
  };

  const filteredOffers = offers.filter(offer =>
    offer.crop.toLowerCase().includes(search.toLowerCase()) ||
    offer.location.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'closed': return 'bg-muted text-muted-foreground';
      case 'expired': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t('dealer.active');
      case 'closed': return t('dealer.closed');
      case 'expired': return t('dealer.expired');
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold">{t('dealer.buyOffers')}</h1>
            <p className="text-muted-foreground">{t('dealer.buyOffersDesc')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="farm-gradient">
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.newOffer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingOffer ? t('dealer.editOffer') : t('dealer.createOffer')}</DialogTitle>
                <DialogDescription>
                  {t('dealer.buyOffersDesc')}
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
                      placeholder="e.g., Wheat"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variety">{t('dealer.variety')}</Label>
                    <Input
                      id="variety"
                      value={formData.variety}
                      onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
                      placeholder="e.g., Sharbati"
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
                <div className="space-y-2">
                  <Label htmlFor="location">{t('dealer.location')} *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Pune, Maharashtra"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('dealer.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('dealer.notes')}
                    rows={3}
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
                      editingOffer ? t('dealer.editOffer') : t('dealer.createOffer')
                    )}
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
            placeholder={t('dealer.searchFarmers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Offers List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOffers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('dealer.noOffers')}</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{offer.crop}</h3>
                        {offer.variety && (
                          <span className="text-muted-foreground">({offer.variety})</span>
                        )}
                        <Badge className={getStatusColor(offer.status)}>
                          {getStatusLabel(offer.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          ₹{offer.price_per_quintal}/{t('dealer.pricePerQuintal').split('(')[1]?.replace(')', '') || 'quintal'}
                        </span>
                        <span>{offer.quantity_quintals} {t('dealer.quantity').toLowerCase().includes('quintal') ? 'quintals' : 'quintals'}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {offer.location}
                        </span>
                      </div>
                      {offer.description && (
                        <p className="text-sm text-muted-foreground mt-2">{offer.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {offer.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(offer.id, 'closed')}
                        >
                          {t('dealer.closeOffer')}
                        </Button>
                      )}
                      {offer.status === 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(offer.id, 'active')}
                        >
                          {t('dealer.reactivate')}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(offer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)}>
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

export default BuyOffers;
