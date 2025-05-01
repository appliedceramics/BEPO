import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onResult: (result: string) => void;
  buttonTitle?: string;
  placeholder?: string;
  inProgress?: boolean;
  fieldType?: string; // Optional field type for component identification
}

export function VoiceInput({
  onResult,
  buttonTitle = "Voice Input",
  placeholder = "Speak now...",
  inProgress = false,
  fieldType,
}: VoiceInputProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Voice input result:", transcript);
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      toast({
        title: "Voice input error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive",
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setSpeechRecognition(recognition);

    return () => {
      if (speechRecognition) {
        speechRecognition.abort();
      }
    };
  }, [onResult, toast]);

  const toggleListening = () => {
    if (!speechRecognition) {
      toast({
        title: "Voice input not available",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognition.start();
        setIsListening(true);
        toast({
          title: placeholder,
          description: "Listening for your voice input...",
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({
          title: "Voice input error",
          description: "Could not start voice recognition. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleListening}
      disabled={inProgress}
      className="rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200"
      title={buttonTitle}
    >
      {isListening ? (
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      ) : (
        <Mic className="h-5 w-5 text-primary" />
      )}
    </Button>
  );
}
