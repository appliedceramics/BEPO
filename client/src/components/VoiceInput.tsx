import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Add TypeScript interface for Web Speech API since it's not included by default
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult[];
  [index: number]: SpeechRecognitionResult[];
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
}

// Add type compatibility for browser prefixes
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface VoiceInputProps {
  onResult: (value: number) => void;
  placeholder: string;
  fieldType: 'bg' | 'carbs';
}

export function VoiceInput({ onResult, placeholder, fieldType }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // Use the appropriate speech recognition interface
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        const recognitionInstance = new SpeechRecognitionConstructor();
        
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';
        
        setRecognition(recognitionInstance);
      }
    }
  }, []);

  // Process speech recognition results
  const processResult = useCallback((transcript: string) => {
    // Extract numbers from speech
    const numbersPattern = /\d+(\.\d+)?/g;
    const matches = transcript.match(numbersPattern);
    
    if (matches && matches.length > 0) {
      // Use the first number found
      const value = parseFloat(matches[0]);
      onResult(value);
      
      // Show success message
      toast({
        title: "Voice Input Detected",
        description: `${fieldType === 'bg' ? 'Blood glucose' : 'Carbs'} set to ${value}`,
      });
    } else {
      // No numbers found in speech
      toast({
        title: "No Value Detected",
        description: `Please try again with a number for ${fieldType === 'bg' ? 'blood glucose' : 'carbs'}`,
        variant: "destructive",
      });
    }
  }, [onResult, toast, fieldType]);

  // Setup speech recognition events
  useEffect(() => {
    if (!recognition) return;
    
    const handleResult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      let transcript = '';
      
      // Convert results to string
      for (let i = 0; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }
      
      processResult(transcript.toLowerCase());
      setIsListening(false);
    };
    
    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      toast({
        title: "Voice Recognition Error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive",
      });
      setIsListening(false);
    };
    
    const handleEnd = () => {
      setIsListening(false);
    };
    
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;
    
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [recognition, processResult, toast]);

  // Toggle listening
  const toggleListening = () => {
    if (!recognition) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: `Say your ${fieldType === 'bg' ? 'blood glucose' : 'carbs'} value`,
        });
      } catch (error) {
        console.error('Failed to start speech recognition', error);
        toast({
          title: "Could Not Start Voice Input",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleListening}
      className={`ml-2 transition-all duration-300 ${isListening ? 'bg-primary/10 border-primary animate-pulse' : ''}`}
      title={`${isListening ? 'Stop' : 'Start'} voice input for ${placeholder}`}
    >
      {isListening ? (
        <Mic className="h-4 w-4 text-primary" />
      ) : (
        <MicOff className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}