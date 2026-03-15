import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealerAPI } from '@/lib/api';
import {
  ShoppingBag,
  Users,
  Package,
  ClipboardList,
  TrendingUp,
  Plus,
  IndianRupee,
  ArrowRight,
} from 'lucide-react';

const DealerDashboard = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    activeOffers: 0,
    totalInventory: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [offers, inventory, orders] = await Promise.all([
        dealerAPI.getBuyOffers(),
        dealerAPI.getInventory(),
        dealerAPI.getOrders(),
      ]);

      const activeOffers = (offers || []).filter((o) => o.status === 'active').length;
      const totalInventory =
        (inventory || []).reduce(
          (sum, item) => sum + Number(item.quantity_quintals || 0),
          0
        ) || 0;
      const pendingOrders =
        (orders || []).filter(
          (o) => o.status !== 'delivered' && o.status !== 'cancelled'
        ).length || 0;
      const completedOrders =
        (orders || []).filter((o) => o.status === 'delivered').length || 0;

      setStats({
        activeOffers,
        totalInventory,
        pendingOrders,
        completedOrders,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShoppingBag,
      title: t('dealer.buyOffers'),
      description: t('dealer.buyOffersDesc'),
      href: '/dealer/buy-offers',
      color: 'bg-primary/10 text-primary',
      stat: `${stats.activeOffers} ${t('dealer.active')}`,
    },
    {
      icon: Users,
      title: t('dealer.farmerDirectory'),
      description: t('dealer.farmerDirectoryDesc'),
      href: '/dealer/farmers',
      color: 'bg-info/10 text-info',
      stat: t('dealer.browseFarmers'),
    },
    {
      icon: Package,
      title: t('dealer.inventory'),
      description: t('dealer.inventoryDesc'),
      href: '/dealer/inventory',
      color: 'bg-success/10 text-success',
      stat: `${stats.totalInventory} ${t('dealer.quintalsInStock')}`,
    },
    {
      icon: ClipboardList,
      title: t('dealer.orders'),
      description: t('dealer.ordersDesc'),
      href: '/dealer/orders',
      color: 'bg-warning/10 text-warning-foreground',
      stat: `${stats.pendingOrders} ${t('dealer.pending')}`,
    },
  ];

  return (
    <Layout>
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">
            {t('dealer.welcome')}, {profile?.full_name || 'Dealer'}!
          </h1>
          <p className="text-muted-foreground mt-2">{t('dealer.subtitle')}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeOffers}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dealer.activeOffers')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalInventory}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dealer.quintalsInStock')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dealer.pendingOrders')}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
                <p className="text-sm text-muted-foreground">
                  {t('dealer.completed')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary">{feature.stat}</Badge>
                </div>
                <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={feature.href}>
                    {t('dealer.open')} {feature.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dealer.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button asChild className="farm-gradient">
              <Link to="/dealer/buy-offers">
                <Plus className="mr-2 h-4 w-4" />
                {t('dealer.postNewOffer')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dealer/inventory">
                <Package className="mr-2 h-4 w-4" />
                {t('dealer.addInventory')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/market-prices">
                <IndianRupee className="mr-2 h-4 w-4" />
                {t('dealer.checkPrices')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DealerDashboard;

