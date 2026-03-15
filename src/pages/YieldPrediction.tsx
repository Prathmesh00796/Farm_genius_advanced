import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { aiAPI, yieldPredictionsAPI } from '@/lib/api';
import { 
  TrendingUp, 
  Calendar, 
  Coins, 
  BarChart3, 
  Loader2,
  Droplets,
  Sprout,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface PredictionResult {
  estimated_yield: number;
  yield_unit: string;
  harvest_days: number;
  estimated_revenue: number;
  comparison_to_avg: string;
  recommendations: { title: string; description: string }[];
  risk_factors: string[];
  optimal_harvest_date: string;
}

const YieldPrediction: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [formData, setFormData] = useState({
    cropType: '',
    soilType: '',
    areaAcres: '',
    sowingDate: '',
    irrigationType: '',
    fertilizerUsed: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: t('common.pleaseLogin'), variant: 'destructive' });
      return;
    }

    if (!formData.cropType || !formData.soilType || !formData.areaAcres || !formData.sowingDate) {
      toast({ title: t('yield.fillRequired'), variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const predictionResult = await aiAPI.predictYield({ ...formData, areaAcres: parseFloat(formData.areaAcres), language });
      setResult(predictionResult);

      // Save to backend DB with all fields
      await yieldPredictionsAPI.create({ 
        crop_type: formData.cropType,
        soil_type: formData.soilType,
        area_acres: parseFloat(formData.areaAcres),
        sowing_date: formData.sowingDate,
        irrigation_type: formData.irrigationType,
        fertilizer_used: formData.fertilizerUsed,
        estimated_yield: predictionResult.estimated_yield,
        harvest_days: predictionResult.harvest_days,
        estimated_revenue: predictionResult.estimated_revenue,
        comparison_to_avg: predictionResult.comparison_to_avg,
        recommendations: predictionResult.recommendations,
        risk_factors: predictionResult.risk_factors,
        optimal_harvest_date: predictionResult.optimal_harvest_date,
      });

      toast({
        title: t('yield.predictionComplete'),
        description: t('yield.predictionReady'),
      });

    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: t('yield.predictionFailed'),
        description: error instanceof Error ? error.message : t('common.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('yield.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('yield.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                {t('yield.enterDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('yield.cropType')} *</Label>
                  <Select value={formData.cropType} onValueChange={(v) => handleChange('cropType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('yield.selectCrop')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Wheat">{t('crops.wheat')}</SelectItem>
                      <SelectItem value="Rice">{t('crops.rice')}</SelectItem>
                      <SelectItem value="Maize">{t('crops.maize')}</SelectItem>
                      <SelectItem value="Potato">{t('crops.potato')}</SelectItem>
                      <SelectItem value="Cotton">{t('crops.cotton')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('yield.soilType')} *</Label>
                  <Select value={formData.soilType} onValueChange={(v) => handleChange('soilType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('yield.selectSoil')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Loamy">{t('soil.loamy')}</SelectItem>
                      <SelectItem value="Sandy">{t('soil.sandy')}</SelectItem>
                      <SelectItem value="Clay">{t('soil.clay')}</SelectItem>
                      <SelectItem value="Silty">{t('soil.silty')}</SelectItem>
                      <SelectItem value="Black">{t('soil.black')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('yield.area')} *</Label>
                  <Input
                    type="number"
                    placeholder={t('yield.enterArea')}
                    value={formData.areaAcres}
                    onChange={(e) => handleChange('areaAcres', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('yield.sowingDate')} *</Label>
                  <Input
                    type="date"
                    value={formData.sowingDate}
                    onChange={(e) => handleChange('sowingDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('yield.irrigation')}</Label>
                  <Select value={formData.irrigationType} onValueChange={(v) => handleChange('irrigationType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('yield.selectIrrigation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Drip Irrigation">{t('irrigation.drip')}</SelectItem>
                      <SelectItem value="Sprinkler">{t('irrigation.sprinkler')}</SelectItem>
                      <SelectItem value="Flood Irrigation">{t('irrigation.flood')}</SelectItem>
                      <SelectItem value="Rainfed">{t('irrigation.rainfed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('yield.fertilizer')}</Label>
                  <Select value={formData.fertilizerUsed} onValueChange={(v) => handleChange('fertilizerUsed', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('yield.selectFertilizer')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NPK">NPK</SelectItem>
                      <SelectItem value="Urea">{t('fertilizer.urea')}</SelectItem>
                      <SelectItem value="Organic">{t('fertilizer.organic')}</SelectItem>
                      <SelectItem value="Mixed">{t('fertilizer.mixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full farm-gradient" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('yield.predicting')}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {t('yield.predict')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="stat-card">
                    <CardContent className="pt-6 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-primary">{result.estimated_yield}</p>
                      <p className="text-xs text-muted-foreground">{result.yield_unit}</p>
                    </CardContent>
                  </Card>
                  <Card className="stat-card">
                    <CardContent className="pt-6 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-info" />
                      <p className="text-2xl font-bold text-info">~{result.harvest_days}</p>
                      <p className="text-xs text-muted-foreground">{t('yield.harvestDays')}</p>
                    </CardContent>
                  </Card>
                  <Card className="stat-card">
                    <CardContent className="pt-6 text-center">
                      <Coins className="h-8 w-8 mx-auto mb-2 text-secondary" />
                      <p className="text-2xl font-bold text-secondary">₹{result.estimated_revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t('yield.revenue')}</p>
                    </CardContent>
                  </Card>
                  <Card className="stat-card">
                    <CardContent className="pt-6 text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-success" />
                      <p className="text-2xl font-bold text-success">{result.comparison_to_avg}</p>
                      <p className="text-xs text-muted-foreground">{t('yield.vsAverage')}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      {t('yield.recommendations')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.recommendations.map((rec, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                        <h4 className="font-medium flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-primary" />
                          {rec.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                {result.risk_factors && result.risk_factors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-warning" />
                        {t('yield.riskFactors')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.risk_factors.map((risk, index) => (
                          <Badge key={index} variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {risk}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button className="w-full" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('yield.generateReport')}
                </Button>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{t('yield.noPrediction')}</h3>
                  <p className="text-muted-foreground max-w-sm">
                    {t('yield.noPredictionDesc')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default YieldPrediction;