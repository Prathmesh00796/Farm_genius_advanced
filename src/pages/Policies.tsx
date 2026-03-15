import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { policiesAPI } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  FileText, 
  Coins, 
  CreditCard, 
  Shield, 
  Sprout,
  ExternalLink,
  Calendar
} from 'lucide-react';

interface Policy {
  id: string;
  title: string;
  description: string;
  category: string;
  published_date: string;
  link: string;
}

const Policies: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await policiesAPI.getAll();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'subsidy': return Coins;
      case 'loan': return CreditCard;
      case 'insurance': return Shield;
      case 'program': return Sprout;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'subsidy': return 'bg-success/10 text-success border-success/20';
      case 'loan': return 'bg-info/10 text-info border-info/20';
      case 'insurance': return 'bg-warning/10 text-warning border-warning/20';
      case 'program': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const categories = ['all', 'subsidy', 'loan', 'insurance', 'program'];

  const filteredPolicies = activeTab === 'all' 
    ? policies 
    : policies.filter(p => p.category.toLowerCase() === activeTab);

  const getLocale = () => {
    switch (language) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-IN';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getLocale(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case 'all': return t('policies.allPolicies');
      case 'subsidy': return t('policies.subsidy');
      case 'loan': return t('policies.loan');
      case 'insurance': return t('policies.insurance');
      case 'program': return t('policies.program');
      default: return category;
    }
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('policies.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('policies.subtitle')}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {getCategoryLabel(category)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Policy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-muted-foreground">{t('policies.loading')}</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('policies.noPolicies')}</h3>
              <p className="text-muted-foreground">{t('policies.checkBack')}</p>
            </div>
          ) : (
            filteredPolicies.map((policy) => {
              const Icon = getCategoryIcon(policy.category);
              return (
                <Card key={policy.id} className="feature-card flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={getCategoryColor(policy.category)}>
                        {getCategoryLabel(policy.category)}
                      </Badge>
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-3">{policy.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="flex-1 line-clamp-3">
                      {policy.description}
                    </CardDescription>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(policy.published_date)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => policy.link && window.open(policy.link, '_blank')}
                      >
                        {t('dashboard.readMore')}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="stat-card text-center">
            <CardContent className="pt-6">
              <Coins className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold">{policies.filter(p => p.category.toLowerCase() === 'subsidy').length}</p>
              <p className="text-sm text-muted-foreground">{t('policies.subsidies')}</p>
            </CardContent>
          </Card>
          <Card className="stat-card text-center">
            <CardContent className="pt-6">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-info" />
              <p className="text-2xl font-bold">{policies.filter(p => p.category.toLowerCase() === 'loan').length}</p>
              <p className="text-sm text-muted-foreground">{t('policies.loanSchemes')}</p>
            </CardContent>
          </Card>
          <Card className="stat-card text-center">
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold">{policies.filter(p => p.category.toLowerCase() === 'insurance').length}</p>
              <p className="text-sm text-muted-foreground">{t('policies.insurance')}</p>
            </CardContent>
          </Card>
          <Card className="stat-card text-center">
            <CardContent className="pt-6">
              <Sprout className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{policies.filter(p => p.category.toLowerCase() === 'program').length}</p>
              <p className="text-sm text-muted-foreground">{t('policies.programs')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Policies;