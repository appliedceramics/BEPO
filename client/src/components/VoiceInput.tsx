import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAchievements } from '@/hooks/use-achievements';

// Define types for the SpeechRecognition Web API
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
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { trackAchievement } = useAchievements();

  useEffect(() => {
    // Check browser support for SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Voice input is not supported in your browser');
      return;
    }

    // Clean up function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    setError('');
    setTranscript('');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Voice input is not supported in your browser');
      return;
    }
    
    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = handleResult;
      recognitionRef.current.onerror = handleError;
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start voice input');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleResult = (event: SpeechRecognitionEvent) => {
    const result = event.results[0][0].transcript;
    setTranscript(result);
    
    // Extract number from speech
    const numberMatch = result.match(/\d+(\.\d+)?/);
    if (numberMatch) {
      const parsedValue = parseFloat(numberMatch[0]);
      if (!isNaN(parsedValue)) {
        onResult(parsedValue);
        
        // Track achievement for voice input usage
        trackAchievement("voice_user", 1);
        
        // If this was a successful voice recognition with high confidence,
        // track voice accuracy achievement
        const confidence = event.results[0][0].confidence;
        if (confidence > 0.8) {
          trackAchievement("voice_accuracy", 1);
        }
        
        // Show toast notification
        toast({
          title: `${fieldType === 'bg' ? 'Blood glucose' : 'Carbs'} value recognized`,
          description: `Set to ${parsedValue}${fieldType === 'bg' ? ' mmol/L' : 'g'}`,
        });
      } else {
        setError('Could not recognize a valid number');
      }
    } else {
      setError('No number detected in your speech');
    }
  };

  const handleError = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error:', event.error);
    setError(`Voice input error: ${event.error}`);
    setIsListening(false);
  };

  return (
    <div className="flex items-center space-x-2 mb-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={isListening ? stopListening : startListening}
        className={isListening ? "bg-red-100 text-red-500 hover:bg-red-200" : ""}
        disabled={!!error && error.includes('not supported')}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      
      {isListening && (
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Listening...</span>
        </div>
      )}
      
      {transcript && !isListening && (
        <span className="text-sm text-muted-foreground">
          "{transcript}"
        </span>
      )}
      
      {error && !isListening && (
        <span className="text-sm text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}