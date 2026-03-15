import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealerAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Search, Phone, MapPin, Loader2, User } from 'lucide-react';

const FarmerDirectory = () => {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const data = await dealerAPI.getFarmers();
      setFarmers(data || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter((farmer) => {
    const name = (farmer.full_name || '').toLowerCase();
    const village = (farmer.village_city || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || village.includes(q);
  });

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">{t('dealer.farmerDirectory')}</h1>
          <p className="text-muted-foreground">{t('dealer.farmerDirectoryDesc')}</p>
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

        {/* Farmers List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFarmers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('dealer.noFarmers')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFarmers.map((farmer) => (
              <Card key={farmer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {(farmer.full_name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{farmer.full_name}</h3>
                      {farmer.village_city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {farmer.village_city}
                        </p>
                      )}
                      {farmer.phone ? (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(`tel:${farmer.phone}`)}
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            {farmer.phone}
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="mt-3">
                          {t('dealer.noContact')}
                        </Badge>
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

export default FarmerDirectory;

