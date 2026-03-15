import React, { useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { aiAPI, cropScansAPI } from '@/lib/api';
import TextToSpeech from '@/components/voice/TextToSpeech';
import {
  Upload, Camera, Leaf, AlertTriangle, CheckCircle2,
  Share2, Printer, Save, Loader2, X, Info, Beaker, Sprout, ShieldAlert
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'none': return 'bg-success/10 text-success border-success/20';
    case 'low': return 'bg-success/10 text-success border-success/20';
    case 'medium': return 'bg-warning/10 text-warning border-warning/20';
    case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'critical': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getSpreadColor = (risk) => {
  switch (risk?.toLowerCase()) {
    case 'low': return 'text-success';
    case 'medium': return 'text-warning';
    case 'high': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const CropScan = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('chemical'); // 'chemical' | 'organic' | 'prevention'
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // ── Speech text ──────────────────────────────────────────────────────────────
  const getSpeechText = () => {
    if (!result) return '';
    if (result.tts_summary) return result.tts_summary;
    const treatments = [...(result.chemical_treatment || []), ...(result.organic_treatment || [])].join('. ');
    return `${result.crop_name}. ${result.disease_name}. ${result.description}. ${result.affected_parts}. Treatments: ${treatments}`;
  };

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t('cropScan.fileTooLarge'), description: t('cropScan.fileTooLargeDesc'), variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Analysis ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedImage || !user) return;

    setIsAnalyzing(true);
    setResult(null);

    // Initializing analysis...
    toast({
      title: "🚀 Initializing Analysis...",
      description: "Optimizing image for Deep Learning inference...",
    });

    try {
      // Simulate dataset loading for effect
      await new Promise(r => setTimeout(r, 1500));
      
      const analysisResult = await aiAPI.analyzeCrop(selectedImage, language);
      setResult(analysisResult);
      setActiveTab('chemical');

      // Persist URL-based scans only
      if (!selectedImage.startsWith('data:')) {
        await cropScansAPI.create(selectedImage).catch(() => { });
      }

      toast({ title: t('cropScan.analysisComplete'), description: t('cropScan.analysisCompleteDesc') });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: t('cropScan.analysisFailed'),
        description: error instanceof Error ? error.message : t('cropScan.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('cropScan.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('cropScan.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Upload + Results ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  {t('cropScan.upload')}
                </CardTitle>
                <CardDescription>{t('cropScan.uploadDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedImage ? (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{t('cropScan.chooseFile')}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t('cropScan.dragDrop')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('cropScan.fileTypes')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
                      <img src={selectedImage} alt="Selected crop" className="w-full h-full object-contain" />
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2" onClick={clearImage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                        {t('cropScan.changeImage')}
                      </Button>
                      <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 farm-gradient">
                        {isAnalyzing ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('cropScan.analyzing')}</>
                        ) : (
                          <><Leaf className="mr-2 h-4 w-4" />{t('cropScan.analyze')}</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Results card ── */}
            {result && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                        {result.crop_name}
                      </p>
                      <CardTitle className="flex items-center gap-2">
                        {result.severity === 'none' || result.disease_name.toLowerCase().includes('healthy') ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                        {result.disease_name}
                      </CardTitle>
                      {result.disease_name_english && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{result.disease_name_english}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity} severity
                      </Badge>
                      {result.spread_risk && (
                        <span className={`text-xs font-medium flex items-center gap-1 ${getSpreadColor(result.spread_risk)}`}>
                          <ShieldAlert className="h-3 w-3" />
                          Spread risk: {result.spread_risk}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{t('cropScan.confidence')}</span>
                      <span className="text-sm text-muted-foreground">{result.confidence}%</span>
                    </div>
                    <Progress value={result.confidence} className="h-2" />
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-medium mb-1 text-sm">{t('cropScan.description')}</h4>
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                  </div>

                  {/* Symptoms */}
                  {result.symptoms?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.symptoms.map((s, i) => (
                          <span key={i} className="text-xs bg-muted rounded-full px-3 py-1">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Affected parts */}
                  <div>
                    <h4 className="font-medium mb-1 text-sm">{t('cropScan.affectedParts')}</h4>
                    <p className="text-sm text-muted-foreground">{result.affected_parts}</p>
                  </div>

                  {/* Treatment tabs */}
                  <div>
                    <div className="flex gap-1 mb-3 bg-muted rounded-lg p-1">
                      {[
                        { key: 'chemical', label: 'Chemical', icon: Beaker },
                        { key: 'organic', label: 'Organic', icon: Sprout },
                        { key: 'prevention', label: 'Prevention', icon: ShieldAlert },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-md transition-colors font-medium
                            ${activeTab === key
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'chemical' && (
                      <ul className="space-y-2">
                        {(result.chemical_treatment || []).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Beaker className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeTab === 'organic' && (
                      <ul className="space-y-2">
                        {(result.organic_treatment || []).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Sprout className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeTab === 'prevention' && (
                      <ul className="space-y-2">
                        {(result.preventive_measures || []).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Impact & Conditions */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 transition-all hover:shadow-md">
                      <h5 className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Impact</h5>
                      <p className="text-xs font-semibold text-foreground leading-tight">{result.economic_impact || 'Moderate loss'}</p>
                    </div>
                    <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-4 transition-all hover:shadow-md">
                      <h5 className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">Spray Time</h5>
                      <p className="text-xs font-semibold text-foreground leading-tight">{result.best_time_to_spray || 'Early Morning'}</p>
                    </div>
                  </div>

                  {/* Consultation alert */}
                  {result.when_to_consult_expert && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-pulse-slow">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <Info className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="text-[10px] uppercase tracking-widest font-bold text-amber-700">Expert Consultation</h5>
                        <p className="text-xs font-medium text-amber-900 leading-tight">{result.when_to_consult_expert}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <TextToSpeech text={getSpeechText()} showLabel variant="default" className="farm-gradient" />
                    <Button variant="outline" size="sm"><Save className="mr-2 h-4 w-4" />{t('common.save')}</Button>
                    <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" />{t('common.share')}</Button>
                    <Button variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" />{t('common.print')}</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-info" />
                  {t('cropScan.tipsTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['tip1', 'tip2', 'tip3', 'tip4'].map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{t(`cropScan.${tip}`)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('cropScan.commonDiseases')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[t('cropScan.disease1'), t('cropScan.disease2'), t('cropScan.disease3'), t('cropScan.disease4')].map((disease) => (
                  <div key={disease} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <p className="font-medium text-sm">{disease}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('cropScan.clickToLearn')}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CropScan;