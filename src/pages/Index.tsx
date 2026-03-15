import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Leaf, 
  Scan, 
  TrendingUp, 
  Store, 
  MapPin, 
  MessageCircle,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Check
} from 'lucide-react';

const Index: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const features = [
    {
      icon: Scan,
      title: t('landing.cropScan.title'),
      description: t('landing.cropScan.desc'),
      color: 'bg-primary/10 text-primary'
    },
    {
      icon: TrendingUp,
      title: t('landing.yield.title'),
      description: t('landing.yield.desc'),
      color: 'bg-secondary/20 text-secondary-foreground'
    },
    {
      icon: Store,
      title: t('landing.market.title'),
      description: t('landing.market.desc'),
      color: 'bg-info/10 text-info'
    },
    {
      icon: MapPin,
      title: t('landing.nearby.title'),
      description: t('landing.nearby.desc'),
      color: 'bg-success/10 text-success'
    },
    {
      icon: MessageCircle,
      title: t('landing.chat.title'),
      description: t('landing.chat.desc'),
      color: 'bg-warning/10 text-warning-foreground'
    },
    {
      icon: Shield,
      title: t('landing.policy.title'),
      description: t('landing.policy.desc'),
      color: 'bg-destructive/10 text-destructive'
    }
  ];

  const stats = [
    { value: '10,000+', label: t('stats.farmersHelped') },
    { value: '95%', label: t('stats.accuracy') },
    { value: '500+', label: t('stats.marketsListed') },
    { value: '24/7', label: t('stats.aiSupport') }
  ];

  const benefits = [
    t('benefits.free'),
    t('benefits.languages'),
    t('benefits.noExpertise'),
    t('benefits.experts'),
    t('benefits.updates'),
    t('benefits.community')
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              {t('landing.hero.badge')}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              {t('landing.hero.title').includes('FarmGenius') ? (
                t('landing.hero.title')
              ) : (
                <>
                  {t('landing.hero.title')}{' '}
                  <span className="text-primary">FarmGenius</span>
                </>
              )}
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Button size="lg" className="farm-gradient text-lg px-8" asChild>
                  <Link to="/dashboard">
                    {t('nav.dashboard')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="farm-gradient text-lg px-8" asChild>
                    <Link to="/auth?mode=signup">
                      {t('landing.hero.getStarted')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                    <Link to="/auth">{t('nav.login')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold">{t('landing.features.title')}</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card group">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">{t('benefits.title')}</h2>
              <p className="text-muted-foreground mt-4">
                {t('benefits.subtitle')}
              </p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              
              {!user && (
                <Button className="mt-8 farm-gradient" size="lg" asChild>
                  <Link to="/auth?mode=signup">
                    {t('benefits.startButton')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <Leaf className="h-24 w-24 text-primary mx-auto" />
                  <p className="mt-4 text-xl font-display font-semibold">{t('benefits.smartAg')}</p>
                  <p className="text-muted-foreground">{t('benefits.poweredByAI')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="farm-gradient overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center text-primary-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl md:text-3xl font-display font-bold">{t('landing.cta.title')}</h2>
              <p className="mt-4 opacity-90 max-w-xl mx-auto">
                {t('landing.cta.subtitle')}
              </p>
              {!user && (
                <Button size="lg" className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
                  <Link to="/auth?mode=signup">
                    {t('landing.cta.button')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
