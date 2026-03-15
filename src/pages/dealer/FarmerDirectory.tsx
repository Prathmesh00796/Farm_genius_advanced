import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Search, Phone, MapPin, Loader2, User } from 'lucide-react';

interface Farmer {
  id: string;
  full_name: string;
  phone: string | null;
  village_city: string | null;
  avatar_url: string | null;
}

const FarmerDirectory: React.FC = () => {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      // Get all user IDs with farmer role
      const { data: farmerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'farmer');

      if (rolesError) throw rolesError;

      if (farmerRoles && farmerRoles.length > 0) {
        const farmerIds = farmerRoles.map(r => r.user_id);
        
        // Get profiles for those farmers
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, village_city, avatar_url')
          .in('id', farmerIds);

        if (profilesError) throw profilesError;
        setFarmers(profiles || []);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (farmer.village_city && farmer.village_city.toLowerCase().includes(search.toLowerCase()))
  );

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
                        {farmer.full_name.charAt(0).toUpperCase()}
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
                      {farmer.phone && (
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
                      )}
                      {!farmer.phone && (
                        <Badge variant="secondary" className="mt-3">
                          No contact info
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
