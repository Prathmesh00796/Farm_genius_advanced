import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nearbyMarketsAPI } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Navigation,
  Filter,
  Locate
} from 'lucide-react';

const NearbyMarkets = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distanceFilter, setDistanceFilter] = useState('10');
  const [cropFilter, setCropFilter] = useState('all');
  const { t } = useLanguage();

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await nearbyMarketsAPI.getAll();
      setMarkets(data);
    } catch (err) {
      console.error('Failed to fetch markets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleGetDirections = (market) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${market.latitude},${market.longitude}`;
    window.open(url, '_blank');
  };

  const filteredMarkets = markets.filter((market) => {
    if (cropFilter === 'all') return true;
    return market.available_crops?.includes(cropFilter);
  });

  const allCrops = [...new Set(markets.flatMap(m => m.available_crops || []))];

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-secondary fill-secondary' : 'text-muted-foreground'}`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
  };

  const getSimulatedDistance = (index) => {
    const distances = [3.2, 8.7, 12.4, 15.1, 20.3];
    return distances[index % distances.length];
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('nearby.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('nearby.subtitle')}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              {t('nearby.findMarkets')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button onClick={handleGetLocation} variant="outline" className="flex items-center gap-2">
                <Locate className="h-4 w-4" />
                {t('nearby.useLocation')}
              </Button>
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder={t('nearby.distance')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cropFilter} onValueChange={setCropFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('market.allCrops')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('market.allCrops')}</SelectItem>
                  {allCrops.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p>{t('nearby.interactiveMap')}</p>
                <p className="text-sm">{t('nearby.marketsOnMap')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-muted-foreground">{t('nearby.loadingMarkets')}</p>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t('nearby.noMarkets')}</h3>
                <p className="text-muted-foreground">{t('nearby.adjustFilters')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredMarkets.map((market, index) => (
              <Card key={market.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-display font-semibold">{market.name}</h3>
                          <Badge variant="outline" className="mt-1 bg-primary/10 text-primary border-primary/20">
                            {getSimulatedDistance(index)} km
                          </Badge>
                        </div>
                        {renderStars(market.rating)}
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{market.address}</span>
                        </div>
                        {market.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span>{market.phone}</span>
                          </div>
                        )}
                        {market.opening_hours && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{market.opening_hours}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">{t('nearby.availableCrops')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {market.available_crops?.map((crop) => (
                            <Badge key={crop} variant="secondary">{crop}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2">
                      <Button 
                        className="farm-gradient flex-1 md:flex-none"
                        onClick={() => handleGetDirections(market)}
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        {t('nearby.getDirections')}
                      </Button>
                      <Button variant="outline" className="flex-1 md:flex-none">
                        <Phone className="mr-2 h-4 w-4" />
                        {t('nearby.call')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NearbyMarkets;
