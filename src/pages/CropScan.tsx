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
import html2pdf from 'html2pdf.js';
import {
  Upload,
  Camera,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Printer,
  Save,
  Loader2,
  X,
  Info
} from 'lucide-react';

interface AnalysisResult {
  disease_name: string;
  confidence: number;
  description: string;
  recommendations: string[];
  severity: string;
  affected_parts: string;
}

const CropScan: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Generate speech text for TTS
  const getSpeechText = () => {
    if (!result) return '';

    const recommendations = result.recommendations.join('. ');

    if (language === 'hi') {
      return `रोग का नाम: ${result.disease_name}. विश्वास स्तर: ${result.confidence} प्रतिशत. विवरण: ${result.description}. प्रभावित भाग: ${result.affected_parts}. सिफारिशें: ${recommendations}`;
    } else if (language === 'mr') {
      return `रोगाचे नाव: ${result.disease_name}. विश्वास पातळी: ${result.confidence} टक्के. वर्णन: ${result.description}. प्रभावित भाग: ${result.affected_parts}. शिफारसी: ${recommendations}`;
    } else if (language === 'kn') {
      return `ರೋಗದ ಹೆಸರು: ${result.disease_name}. ವಿಶ್ವಾಸ ಮಟ್ಟ: ${result.confidence} ಪ್ರತಿಶತ. ವಿವರಣೆ: ${result.description}. ಪೀಡಿತ ಭಾಗಗಳು: ${result.affected_parts}. ಶಿಫಾರಸುಗಳು: ${recommendations}`;
    }

    return `Disease detected: ${result.disease_name}. Confidence: ${result.confidence} percent. Description: ${result.description}. Affected parts: ${result.affected_parts}. Recommendations: ${recommendations}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('cropScan.fileTooLarge'),
          description: t('cropScan.fileTooLargeDesc'),
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const syntheticEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !user) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Use base64 data URL directly as the imageUrl for the backend
      const analysisResult = await aiAPI.analyzeCrop(selectedImage, language);
      setResult(analysisResult);

      // Save scan record to backend DB (skip if image is a base64 data URI — too large for a URL column)
      const isBase64 = selectedImage.startsWith('data:');
      if (!isBase64) {
        await cropScansAPI.create(selectedImage);
      }

      toast({
        title: t('cropScan.analysisComplete'),
        description: t('cropScan.analysisCompleteDesc'),
      });
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

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSavePdf = () => {
    const element = document.getElementById('scan-result-card');
    if (!element) return;

    toast({
      title: t('common.save') + '...',
      description: "Generating PDF report...",
    });

    const opt = {
      margin: 10,
      filename: `crop-scan-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    const handleVoiceCommand = (e: Event) => {
      const action = (e as CustomEvent).detail?.action;
      if (!action) return;

      const printCommands = ['print', 'प्रिंट', 'छापा', 'प्रिन्ट', 'ಮುದ್ರಿಸಿ'];
      const saveCommands = ['save', 'download', 'pdf', 'सेव', 'डाउनलोड', 'सेव्ह', 'ಉಳಿಸು'];

      if (printCommands.some(cmd => action.includes(cmd))) {
        if (result) {
          handlePrint();
        }
      } else if (saveCommands.some(cmd => action.includes(cmd))) {
        if (result) {
          handleSavePdf();
        }
      }
    };

    window.addEventListener('voice-command', handleVoiceCommand);
    return () => window.removeEventListener('voice-command', handleVoiceCommand);
  }, [result]);

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">{t('cropScan.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('cropScan.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  {t('cropScan.upload')}
                </CardTitle>
                <CardDescription>
                  {t('cropScan.uploadDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedImage ? (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
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
                      <img
                        src={selectedImage}
                        alt="Selected crop"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        {t('cropScan.changeImage')}
                      </Button>
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex-1 farm-gradient"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('cropScan.analyzing')}
                          </>
                        ) : (
                          <>
                            <Leaf className="mr-2 h-4 w-4" />
                            {t('cropScan.analyze')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <Card id="scan-result-card" className="animate-fade-in p-4 print:shadow-none print:border-none">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {result.disease_name.toLowerCase() === 'healthy' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                        {t('cropScan.detected')}: {result.disease_name}
                      </CardTitle>
                      <CardDescription className="mt-1">{new Date().toLocaleDateString()}</CardDescription>
                    </div>
                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getSeverityColor(result.severity)}`}>
                      {result.severity} {t('cropScan.severity')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Image in PDF */}
                  <div className="hidden print:block mb-6">
                    <img src={selectedImage || ''} alt="Analyzed Crop" className="max-w-xs rounded-lg border" />
                  </div>

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
                    <h4 className="font-medium mb-2">{t('cropScan.description')}</h4>
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                  </div>

                  {/* Affected Parts */}
                  <div>
                    <h4 className="font-medium mb-2">{t('cropScan.affectedParts')}</h4>
                    <p className="text-sm text-muted-foreground">{result.affected_parts}</p>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-3">{t('cropScan.recommendations')}</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t print:hidden" data-html2canvas-ignore="true">
                    <TextToSpeech
                      text={getSpeechText()}
                      showLabel={true}
                      variant="default"
                      className="farm-gradient"
                    />
                    <Button variant="outline" size="sm" onClick={handleSavePdf}>
                      <Save className="mr-2 h-4 w-4" />
                      {t('common.save')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      {t('common.share')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      {t('common.print')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tips Section */}
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
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('cropScan.tip1')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('cropScan.tip2')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('cropScan.tip3')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t('cropScan.tip4')}</span>
                  </li>
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