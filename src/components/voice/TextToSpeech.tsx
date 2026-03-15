import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TextToSpeechProps {
  text: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ 
  text, 
  className,
  variant = 'outline',
  size = 'sm',
  showLabel = true
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { language, t } = useLanguage();

  const getLanguageCode = useCallback(() => {
    switch (language) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-IN';
    }
  }, [language]);

  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    setIsLoading(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode();
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    const langCode = getLanguageCode();
    
    // Find a matching voice for the language
    const matchingVoice = voices.find(voice => 
      voice.lang.startsWith(langCode.split('-')[0])
    );
    
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsLoading(false);
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsLoading(false);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [text, isSpeaking, getLanguageCode]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  if (!('speechSynthesis' in window)) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={isSpeaking ? stop : speak}
      className={cn(
        isSpeaking && "bg-primary/10",
        className
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSpeaking ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isSpeaking 
            ? (t('voice.stop') || 'Stop') 
            : (t('voice.listen') || 'Listen')
          }
        </span>
      )}
    </Button>
  );
};

export default TextToSpeech;
