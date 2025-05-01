import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
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

  const startListening = () => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice input not available",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsListening(true);
      
      // Initialize speech recognition
      const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice input result:", transcript);
        onResult(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
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

      toast({
        title: placeholder,
        description: "Listening for your voice input...",
      });
      
      recognition.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast({
        title: "Voice input error",
        description: "Could not start voice recognition. Please try again.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={startListening}
      disabled={inProgress || isListening}
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
