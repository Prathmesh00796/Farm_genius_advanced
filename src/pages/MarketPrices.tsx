import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { marketAPI } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Search,
  Store,
  Filter
} from 'lucide-react';

interface MarketPrice {
  id: string;
  crop: string;
  variety: string;
  market: string;
  location: string;
  price_per_quintal: number;
  trend_percentage: number;
  updated_at: string;
}

const MarketPrices: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const data = await marketAPI.getPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrices = prices.filter((price) => {
    const matchesSearch = 
      price.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.market.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCrop = cropFilter === 'all' || price.crop === cropFilter;
    const matchesLocation = locationFilter === 'all' || price.location === locationFilter;
    
    return matchesSearch && matchesCrop && matchesLocation;
  });

  const uniqueCrops = [...new Set(prices.map(p => p.crop))];
  const uniqueLocations = [...new Set(prices.map(p => p.location))];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendBadge = (trend: number) => {
    if (trend > 0) return <Badge className="bg-success/10 text-success border-success/20">+{trend}%</Badge>;
    if (trend < 0) return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{trend}%</Badge>;
    return <Badge variant="outline">0%</Badge>;
  };

  const getLocale = () => {
    switch (language) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-IN';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return t('market.justNow');
    if (diffHours < 24) return `${diffHours} ${t('market.hoursAgo')}`;
    return `${Math.floor(diffHours / 24)} ${t('market.daysAgo')}`;
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('market.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('market.subtitle')}</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              {t('market.filterPrices')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('market.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={cropFilter} onValueChange={setCropFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('market.allCrops')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('market.allCrops')}</SelectItem>
                  {uniqueCrops.map(crop => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t('market.allLocations')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('market.allLocations')}</SelectItem>
                  {uniqueLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchPrices}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Price Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {t('market.currentPrices')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('market.crop')}</TableHead>
                    <TableHead>{t('market.variety')}</TableHead>
                    <TableHead>{t('market.marketName')}</TableHead>
                    <TableHead className="text-right">{t('market.price')}</TableHead>
                    <TableHead className="text-center">{t('market.trend')}</TableHead>
                    <TableHead className="text-right">{t('market.lastUpdated')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrices.map((price) => (
                    <TableRow key={price.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{price.crop}</TableCell>
                      <TableCell className="text-muted-foreground">{price.variety}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{price.market}</p>
                          <p className="text-xs text-muted-foreground">{price.location}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{price.price_per_quintal.toLocaleString(getLocale())}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(price.trend_percentage)}
                          {getTrendBadge(price.trend_percentage)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatTimeAgo(price.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {t('market.dataSource')}
            </p>
          </CardContent>
        </Card>

        {/* Price Trends Chart Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('market.priceTrends')}</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                <p>{t('market.trendChart')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('market.marketComparison')}</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Store className="h-12 w-12 mx-auto mb-2" />
                <p>{t('market.comparisonChart')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MarketPrices;