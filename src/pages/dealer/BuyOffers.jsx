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
import { Plus, Search, Trash2, Loader2, IndianRupee, MapPin } from 'lucide-react';

const BuyOffers = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    crop_type: '',
    variety: '',
    quantity_quintals: '',
    price_per_quintal: '',
    location: '',
    quality_requirements: '',
  });

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      const data = await dealerAPI.getBuyOffers();
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
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
        price_per_quintal: parseFloat(formData.price_per_quintal),
        location: formData.location || null,
        quality_requirements: formData.quality_requirements || null,
      };

      await dealerAPI.createBuyOffer(payload);
      toast.success('Offer created successfully!');

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      await dealerAPI.deleteBuyOffer(id);
      toast.success('Offer deleted');
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const resetForm = () => {
    setFormData({
      crop_type: '',
      variety: '',
      quantity_quintals: '',
      price_per_quintal: '',
      location: '',
      quality_requirements: '',
    });
  };

  const filteredOffers = offers.filter((offer) => {
    const crop = (offer.crop_type || '').toLowerCase();
    const location = (offer.location || '').toLowerCase();
    const q = search.toLowerCase();
    return crop.includes(q) || location.includes(q);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      case 'expired':
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
            <h1 className="text-3xl font-display font-bold">{t('dealer.buyOffers')}</h1>
            <p className="text-muted-foreground">{t('dealer.buyOffersDesc')}</p>
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
                {t('dealer.newOffer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('dealer.createOffer')}</DialogTitle>
                <DialogDescription>{t('dealer.buyOffersDesc')}</DialogDescription>
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
                      placeholder="e.g., Wheat"
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
                <div className="space-y-2">
                  <Label htmlFor="location">{t('dealer.location')}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="e.g., Nashik APMC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">{t('dealer.qualityRequirements')}</Label>
                  <Textarea
                    id="requirements"
                    value={formData.quality_requirements}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quality_requirements: e.target.value,
                      }))
                    }
                    placeholder="Any quality or moisture content requirements"
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
            placeholder={t('dealer.searchOffers')}
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
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {offer.crop_type}
                      <Badge className={getStatusColor(offer.status || 'active')}>
                        {offer.status || 'active'}
                      </Badge>
                    </CardTitle>
                    {offer.variety && (
                      <p className="text-sm text-muted-foreground">{offer.variety}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-lg font-semibold">
                      <IndianRupee className="h-4 w-4" />
                      {Number(offer.price_per_quintal)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Number(offer.quantity_quintals)} {t('dealer.quintals')}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  {offer.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{offer.location}</span>
                    </div>
                  )}
                  {offer.quality_requirements && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t('dealer.qualityRequirements')}
                      </p>
                      <p className="text-sm">{offer.quality_requirements}</p>
                    </div>
                  )}
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/40"
                      onClick={() => handleDelete(offer.id)}
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

export default BuyOffers;

