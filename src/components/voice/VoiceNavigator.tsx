import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { findNavigationRoute } from '@/lib/navigation';

// Voice commands mapping for navigation
const voiceCommands: Record<string, { routes: string[]; path: string }> = {
  // English commands
  'home': { routes: ['home', 'main page', 'start', 'homepage'], path: '/' },
  'dashboard': { routes: ['dashboard', 'my dashboard', 'main'], path: '/dashboard' },
  'crop scan': { routes: ['crop scan', 'scan crop', 'disease detection', 'crop disease', 'rog tapasani', 'pik scan', 'bele scan', 'fasal scan'], path: '/crop-scan' },
  'yield prediction': { routes: ['yield prediction', 'yield', 'upaj anuman', 'utpadan andaj', 'ilavari'], path: '/yield-prediction' },
  'market prices': { routes: ['market prices', 'prices', 'bazar bhav', 'bajar bhav', 'marukatte bele'], path: '/market-prices' },
  'nearby markets': { routes: ['nearby markets', 'markets near me', 'nazdiki mandi', 'javalachi bajarepeth', 'hattirada marukatte'], path: '/nearby-markets' },
  'policies': { routes: ['policies', 'government policies', 'schemes', 'sarkari yojana', 'sarkari yojane'], path: '/policies' },
  'profile': { routes: ['profile', 'my profile', 'meri profile', 'majhi profile', 'nanna profile'], path: '/profile' },
  // Dealer routes
  'dealer dashboard': { routes: ['dealer dashboard', 'dealer', 'vyapari dashboard', 'vyapari'], path: '/dealer' },
  'buy offers': { routes: ['buy offers', 'kharid', 'kharedi offer', 'konu offer'], path: '/dealer/buy-offers' },
  'farmers': { routes: ['farmers', 'farmer directory', 'kisan', 'shetkari', 'raitaru'], path: '/dealer/farmers' },
  'inventory': { routes: ['inventory', 'stock', 'maal', 'sangrah'], path: '/dealer/inventory' },
  'orders': { routes: ['orders', 'order', 'aadesh', 'adesh'], path: '/dealer/orders' },
};

// Hindi voice command translations (expanded)
const hindiCommands: Record<string, string> = {
  // Home
  'घर': '/', 'होम': '/', 'मुख्य पृष्ठ': '/', 'शुरुआत': '/', 'मुखपृष्ठ': '/',
  // Dashboard
  'डैशबोर्ड': '/dashboard', 'मेरा डैशबोर्ड': '/dashboard', 'डेशबोर्ड': '/dashboard',
  // Crop Scan
  'फसल स्कैन': '/crop-scan', 'रोग तपासणी': '/crop-scan', 'पिक स्कैन': '/crop-scan',
  'फसल जांच': '/crop-scan', 'रोग पहचान': '/crop-scan', 'बीमारी जांच': '/crop-scan',
  'फसल की जांच': '/crop-scan', 'पौधे की बीमारी': '/crop-scan',
  // Yield Prediction
  'उपज अनुमान': '/yield-prediction', 'उत्पादन अनुमान': '/yield-prediction',
  'फसल उपज': '/yield-prediction', 'पैदावार': '/yield-prediction', 'उपज': '/yield-prediction',
  // Market Prices
  'बाज़ार भाव': '/market-prices', 'मंडी': '/market-prices', 'बाजार भाव': '/market-prices',
  'मंडी भाव': '/market-prices', 'दाम': '/market-prices', 'कीमत': '/market-prices',
  'आज का भाव': '/market-prices', 'मार्केट': '/market-prices',
  // Nearby Markets
  'नज़दीकी मंडी': '/nearby-markets', 'पास की मंडी': '/nearby-markets',
  'नजदीकी बाजार': '/nearby-markets', 'आसपास की मंडी': '/nearby-markets',
  'मंडी ढूंढो': '/nearby-markets', 'बाजार खोजो': '/nearby-markets',
  // Policies
  'सरकारी योजना': '/policies', 'योजनाएं': '/policies', 'योजना': '/policies',
  'सरकारी स्कीम': '/policies', 'किसान योजना': '/policies', 'नीतियां': '/policies',
  // Profile
  'प्रोफ़ाइल': '/profile', 'मेरी प्रोफ़ाइल': '/profile', 'प्रोफाइल': '/profile',
  'मेरा खाता': '/profile', 'अकाउंट': '/profile',
  // Dealer
  'व्यापारी': '/dealer', 'डीलर': '/dealer', 'व्यापारी डैशबोर्ड': '/dealer',
  // Buy Offers
  'खरीद': '/dealer/buy-offers', 'खरीद ऑफर': '/dealer/buy-offers',
  'खरीदी': '/dealer/buy-offers', 'ऑफर': '/dealer/buy-offers',
  // Farmers
  'किसान': '/dealer/farmers', 'किसान सूची': '/dealer/farmers',
  'किसान डायरेक्टरी': '/dealer/farmers',
  // Inventory
  'स्टॉक': '/dealer/inventory', 'माल': '/dealer/inventory',
  'इन्वेंटरी': '/dealer/inventory', 'गोदाम': '/dealer/inventory',
  // Orders
  'ऑर्डर': '/dealer/orders', 'आदेश': '/dealer/orders', 'ऑर्डर्स': '/dealer/orders',
};

// Marathi voice command translations (expanded)
const marathiCommands: Record<string, string> = {
  // Home
  'मुख्यपृष्ठ': '/', 'घर': '/', 'होम': '/', 'सुरुवात': '/',
  // Dashboard
  'डॅशबोर्ड': '/dashboard', 'माझे डॅशबोर्ड': '/dashboard', 'डैशबोर्ड': '/dashboard',
  // Crop Scan
  'पीक स्कॅन': '/crop-scan', 'रोग तपासणी': '/crop-scan', 'पिक स्कॅन': '/crop-scan',
  'पीक तपासणी': '/crop-scan', 'रोग ओळख': '/crop-scan', 'आजार तपासणी': '/crop-scan',
  'पिकाची तपासणी': '/crop-scan',
  // Yield Prediction
  'उत्पादन अंदाज': '/yield-prediction', 'उत्पन्न अंदाज': '/yield-prediction',
  'पीक उत्पादन': '/yield-prediction', 'उत्पादन': '/yield-prediction',
  // Market Prices
  'बाजारभाव': '/market-prices', 'बाजार भाव': '/market-prices', 'भाव': '/market-prices',
  'मार्केट': '/market-prices', 'आजचे भाव': '/market-prices', 'दर': '/market-prices',
  // Nearby Markets
  'जवळची बाजारपेठ': '/nearby-markets', 'जवळचे बाजार': '/nearby-markets',
  'आसपासचे बाजार': '/nearby-markets', 'बाजार शोधा': '/nearby-markets',
  'जवळची मंडी': '/nearby-markets',
  // Policies
  'सरकारी योजना': '/policies', 'योजना': '/policies', 'शासकीय योजना': '/policies',
  'शेतकरी योजना': '/policies', 'स्कीम': '/policies',
  // Profile
  'प्रोफाइल': '/profile', 'माझी प्रोफाइल': '/profile', 'माझे खाते': '/profile',
  // Dealer
  'व्यापारी': '/dealer', 'डीलर': '/dealer', 'व्यापारी डॅशबोर्ड': '/dealer',
  // Buy Offers
  'खरेदी': '/dealer/buy-offers', 'खरेदी ऑफर': '/dealer/buy-offers',
  'ऑफर': '/dealer/buy-offers',
  // Farmers
  'शेतकरी': '/dealer/farmers', 'शेतकरी यादी': '/dealer/farmers',
  // Inventory
  'साठा': '/dealer/inventory', 'माल': '/dealer/inventory', 'इन्व्हेंटरी': '/dealer/inventory',
  // Orders
  'ऑर्डर': '/dealer/orders', 'आदेश': '/dealer/orders',
};

// Kannada voice command translations (expanded)
const kannadaCommands: Record<string, string> = {
  // Home
  'ಮುಖಪುಟ': '/', 'ಹೋಮ್': '/', 'ಮನೆ': '/', 'ಪ್ರಾರಂಭ': '/',
  // Dashboard
  'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್': '/dashboard', 'ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್': '/dashboard',
  'ಡ್ಯಾಶ್ಬೋರ್ಡ್': '/dashboard',
  // Crop Scan
  'ಬೆಳೆ ಸ್ಕ್ಯಾನ್': '/crop-scan', 'ರೋಗ ಪತ್ತೆ': '/crop-scan',
  'ಬೆಳೆ ತಪಾಸಣೆ': '/crop-scan', 'ರೋಗ ಗುರುತಿಸುವಿಕೆ': '/crop-scan',
  'ಗಿಡದ ರೋಗ': '/crop-scan', 'ಬೆಳೆ ರೋಗ': '/crop-scan',
  // Yield Prediction
  'ಇಳುವರಿ ಮುನ್ಸೂಚನೆ': '/yield-prediction', 'ಉತ್ಪಾದನೆ ಅಂದಾಜು': '/yield-prediction',
  'ಇಳುವರಿ': '/yield-prediction', 'ಉತ್ಪಾದನೆ': '/yield-prediction',
  // Market Prices
  'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ': '/market-prices', 'ಬೆಲೆ': '/market-prices',
  'ಮಾರ್ಕೆಟ್': '/market-prices', 'ಇಂದಿನ ಬೆಲೆ': '/market-prices',
  'ಧಾರಣೆ': '/market-prices',
  // Nearby Markets
  'ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆ': '/nearby-markets', 'ಸಮೀಪದ ಮಾರುಕಟ್ಟೆ': '/nearby-markets',
  'ಮಾರುಕಟ್ಟೆ ಹುಡುಕಿ': '/nearby-markets', 'ಹತ್ತಿರದ ಮಂಡಿ': '/nearby-markets',
  // Policies
  'ಸರ್ಕಾರಿ ಯೋಜನೆ': '/policies', 'ಯೋಜನೆ': '/policies',
  'ರೈತ ಯೋಜನೆ': '/policies', 'ಸ್ಕೀಮ್': '/policies',
  // Profile
  'ಪ್ರೊಫೈಲ್': '/profile', 'ನನ್ನ ಪ್ರೊಫೈಲ್': '/profile',
  'ನನ್ನ ಖಾತೆ': '/profile',
  // Dealer
  'ವ್ಯಾಪಾರಿ': '/dealer', 'ಡೀಲರ್': '/dealer',
  // Buy Offers
  'ಖರೀದಿ': '/dealer/buy-offers', 'ಖರೀದಿ ಆಫರ್': '/dealer/buy-offers',
  'ಆಫರ್': '/dealer/buy-offers',
  // Farmers
  'ರೈತರು': '/dealer/farmers', 'ರೈತರ ಪಟ್ಟಿ': '/dealer/farmers',
  // Inventory
  'ದಾಸ್ತಾನು': '/dealer/inventory', 'ಸ್ಟಾಕ್': '/dealer/inventory',
  // Orders
  'ಆದೇಶಗಳು': '/dealer/orders', 'ಆರ್ಡರ್': '/dealer/orders',
};

const VoiceNavigator: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // Check browser support
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
  }, []);

  const getLanguageCode = useCallback(() => {
    switch (language) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-IN';
    }
  }, [language]);

  const findRoute = useCallback((text: string): string | null => {
    // 1. Use the optimized reusable navigation logic
    const route = findNavigationRoute(text);
    if (route) return route;

    const lowerText = text.toLowerCase().trim();
    const normalizedText = text.trim();

    // 2. Fallback to existing command maps for deeper legacy support
    // Check Hindi commands
    for (const [command, path] of Object.entries(hindiCommands)) {
      if (normalizedText.includes(command) || command.includes(normalizedText)) {
        return path;
      }
    }

    // Check Marathi commands
    for (const [command, path] of Object.entries(marathiCommands)) {
      if (normalizedText.includes(command) || command.includes(normalizedText)) {
        return path;
      }
    }

    // Check English commands
    for (const [key, value] of Object.entries(voiceCommands)) {
      if (value.routes.some(route => lowerText.includes(route.toLowerCase()))) {
        return value.path;
      }
    }

    return null;
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = getLanguageCode();
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      if (event.results[current].isFinal) {
        const lowerString = text.toLowerCase().trim();
        // Dispatch custom event for current page to optionally handle actions (like print, save, etc)
        window.dispatchEvent(new CustomEvent('voice-command', { detail: { action: lowerString } }));

        const route = findRoute(text);
        if (route) {
          toast.success(t('voice.navigating') || `Navigating to ${route}`, {
            description: text
          });
          navigate(route);
        } else {
          toast.info(t('voice.notUnderstood') || 'Command not recognized', {
            description: text
          });
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error(t('voice.error') || 'Voice recognition error');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [getLanguageCode, findRoute, navigate, t]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
      {transcript && isListening && (
        <div className="bg-card border border-border rounded-lg px-4 py-2 shadow-lg max-w-[200px] text-sm">
          <p className="text-muted-foreground truncate">{transcript}</p>
        </div>
      )}
      <Button
        onClick={startListening}
        disabled={isListening}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isListening
            ? "bg-destructive hover:bg-destructive/90 animate-pulse"
            : "bg-info hover:bg-info/90"
        )}
        size="icon"
        title={t('voice.tapToSpeak') || 'Tap to speak'}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {t('voice.voiceNav') || 'Voice'}
      </span>
    </div>
  );
};

export default VoiceNavigator;
