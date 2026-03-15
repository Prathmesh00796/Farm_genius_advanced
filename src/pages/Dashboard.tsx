import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { tipsAPI, Tip } from '@/lib/api';
import { 
  Scan, 
  TrendingUp, 
  Store, 
  MapPin, 
  Cloud, 
  Sun, 
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
  FileText,
  ArrowRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [tips, setTips] = useState<Tip[]>([]);

  useEffect(() => {
    tipsAPI.getAll().then(data => setTips(data.slice(0, 3))).catch(() => {});
  }, []);

  const getLocale = () => {
    switch (language) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-US';
    }
  };

  const currentDate = new Date().toLocaleDateString(getLocale(), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const featureCards = [
    {
      title: t('nav.cropScan'),
      description: t('landing.cropScan.desc'),
      icon: Scan,
      href: '/crop-scan',
      color: 'bg-primary/10 text-primary',
      buttonText: t('dashboard.scanNow')
    },
    {
      title: t('nav.yieldPrediction'),
      description: t('landing.yield.desc'),
      icon: TrendingUp,
      href: '/yield-prediction',
      color: 'bg-secondary/20 text-secondary-foreground',
      buttonText: t('dashboard.predictNow')
    },
    {
      title: t('nav.marketPrices'),
      description: t('landing.market.desc'),
      icon: Store,
      href: '/market-prices',
      color: 'bg-info/10 text-info',
      buttonText: t('dashboard.viewPrices')
    },
    {
      title: t('nav.nearbyMarkets'),
      description: t('landing.nearby.desc'),
      icon: MapPin,
      href: '/nearby-markets',
      color: 'bg-success/10 text-success',
      buttonText: t('dashboard.findMarkets')
    }
  ];

  const weatherForecast = [
    { day: t('dashboard.today'), temp: 30, icon: Sun },
    { day: t('dashboard.tue'), temp: 28, icon: Cloud },
    { day: t('dashboard.wed'), temp: 26, icon: CloudRain },
    { day: t('dashboard.thu'), temp: 25, icon: CloudRain },
    { day: t('dashboard.fri'), temp: 27, icon: Sun },
    { day: t('dashboard.sat'), temp: 29, icon: Sun },
    { day: t('dashboard.sun'), temp: 28, icon: Cloud },
  ];

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">
                {t('dashboard.welcome')}, {profile?.full_name?.split(' ')[0] || t('dashboard.farmer')}!
              </h1>
              <p className="text-primary-foreground/80 mt-1 flex items-center gap-2 flex-wrap">
                <span>{currentDate}</span>
                <span className="hidden sm:inline">|</span>
                <span className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4" />
                  30°C, {t('dashboard.sunny')}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                {t('dashboard.viewNotifications')}
              </Button>
              <Button variant="outline" size="sm" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" asChild>
                <Link to="/profile">{t('dashboard.updateProfile')}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((card) => (
            <Card key={card.href} className="feature-card group">
              <CardHeader className="pb-2">
                <div className={`h-12 w-12 rounded-xl ${card.color} flex items-center justify-center mb-2`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Link to={card.href}>
                    {card.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather Forecast */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-info" />
                {t('dashboard.weatherForecast')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weatherForecast.map((day, index) => (
                  <div 
                    key={day.day}
                    className={`text-center p-3 rounded-xl ${index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}`}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-2">{day.day}</p>
                    <day.icon className={`h-6 w-6 mx-auto mb-2 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="font-semibold">{day.temp}°C</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">12 km/h {t('dashboard.wind')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">65% {t('dashboard.humidity')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('dashboard.uvIndex')}: 6</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agricultural Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                {t('dashboard.tipsAlerts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tips.map((tip) => (
                <div key={tip.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-2">
                    {tip.is_alert && (
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tip.content}</p>
                      <Button variant="link" className="h-auto p-0 text-xs mt-1">{t('dashboard.readMore')}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.cropScans')}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">5</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.predictions')}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">₹2,450</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.avgWheatPrice')}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.nearbyMarkets')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
