import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TotalForMeProps {
  onFinalTotal: (totalCarbs: number) => void;
}

type FoodItem = {
  name: string;
  carbs: number;
};

export function TotalForMe({ onFinalTotal }: TotalForMeProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const listeningStateRef = useRef<'waiting' | 'food' | 'carbs'>('waiting');
  const currentFoodRef = useRef<string>("");

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

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
      listeningStateRef.current = 'food';
      setCurrentItem("Listening for food item...");
      
      // Initialize speech recognition
      const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log("Voice input result:", transcript);
        
        // Check for "total" command to finish
        if (transcript === "total" || transcript === "finish" || transcript === "done" || transcript === "calculate") {
          finishTotalCalculation();
          return;
        }
        
        // Process based on current listening state
        if (listeningStateRef.current === 'food') {
          // Captured food name, now ask for carbs
          currentFoodRef.current = transcript;
          listeningStateRef.current = 'carbs';
          setCurrentItem(`"${transcript}" - now tell me the carbs:`);
          
          // Start listening again for carbs
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error("Error restarting recognition:", e);
              }
            }
          }, 1000);
        } else if (listeningStateRef.current === 'carbs') {
          // Try to extract a number from the transcript
          const match = transcript.match(/\d+(\.\d+)?/);
          
          if (match) {
            const carbValue = parseFloat(match[0]);
            if (!isNaN(carbValue) && carbValue >= 0) {
              // Add the food item to our list
              const newItem = {
                name: currentFoodRef.current,
                carbs: carbValue
              };
              
              setFoodItems(prev => [...prev, newItem]);
              
              // Reset and prepare for next food item
              toast({
                title: "Food item added",
                description: `Added ${newItem.name} with ${carbValue}g of carbs`,
              });
              
              listeningStateRef.current = 'food';
              setCurrentItem("Next food item? (or say 'total' to finish)");
              
              // Start listening again for next food
              setTimeout(() => {
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (e) {
                    console.error("Error restarting recognition:", e);
                  }
                }
              }, 1000);
            } else {
              handleRecognitionError("Invalid carb value");
            }
          } else {
            handleRecognitionError("Could not detect a number in your voice input");
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        handleRecognitionError(`Error: ${event.error}. Please try again.`);
      };

      recognition.onend = () => {
        if (isListening && listeningStateRef.current !== 'waiting') {
          // If we're still supposed to be listening, this is an unexpected end
          // We don't restart here because onresult will handle that
          setProgress(prev => (prev + 10) % 100); // Update progress indicator
        }
      };

      toast({
        title: "Total For Me activated",
        description: "Say the name of a food item...",
      });
      
      recognition.start();
      setProgress(10);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast({
        title: "Voice input error",
        description: "Could not start voice recognition. Please try again.",
        variant: "destructive",
      });
      setIsListening(false);
      setCurrentItem(null);
    }
  };

  const handleRecognitionError = (message: string) => {
    toast({
      title: "Voice input error",
      description: message,
      variant: "destructive",
    });
    
    // Reset to food input state
    listeningStateRef.current = 'food';
    setCurrentItem("Try again - say a food item:");
    
    // Restart listening
    setTimeout(() => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Error restarting recognition after error:", e);
        }
      }
    }, 1500);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
    
    setIsListening(false);
    setCurrentItem(null);
    listeningStateRef.current = 'waiting';
    setProgress(0);
    
    if (foodItems.length > 0) {
      finishTotalCalculation();
    } else {
      toast({
        title: "Voice input cancelled",
        description: "No food items were added",
      });
    }
  };

  const finishTotalCalculation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
    
    setIsListening(false);
    setCurrentItem(null);
    listeningStateRef.current = 'waiting';
    setProgress(0);
    
    if (foodItems.length > 0) {
      const total = foodItems.reduce((sum, item) => sum + item.carbs, 0);
      
      toast({
        title: "Total calculated",
        description: `Your total carbs: ${total}g`,
      });
      
      onFinalTotal(total);
    } else {
      toast({
        title: "No items to total",
        description: "Add at least one food item first",
      });
    }
  };

  const clearItems = () => {
    setFoodItems([]);
    if (!isListening) {
      toast({
        title: "Items cleared",
        description: "All food items have been cleared",
      });
    }
  };

  const calculateCurrentTotal = () => {
    return foodItems.reduce((sum, item) => sum + item.carbs, 0);
  };

  return (
    <div className="p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center justify-between">
        <Label className="font-medium text-lg text-primary">Total For Me</Label>
        
        {isListening ? (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={stopListening}
            className="flex items-center gap-1"
          >
            <StopCircle className="h-4 w-4" />
            Stop
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            onClick={startListening}
            className="flex items-center gap-1"
          >
            <Mic className="h-4 w-4" />
            Start
          </Button>
        )}
      </div>
      
      {isListening && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">{currentItem}</p>
          <Progress value={progress} className="h-1 mt-1" />
        </div>
      )}
      
      {foodItems.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Added Items</Label>
            <Button variant="ghost" size="sm" onClick={clearItems} disabled={isListening}>
              Clear All
            </Button>
          </div>
          
          <ScrollArea className="h-24 border rounded-md p-2">
            <div className="space-y-2">
              {foodItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <Badge variant="outline">{item.carbs}g</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium">Current Total:</span>
            <Badge className="bg-primary">{calculateCurrentTotal()}g</Badge>
          </div>
        </div>
      )}
      
      {!isListening && foodItems.length > 0 && (
        <Button 
          className="w-full mt-3" 
          onClick={finishTotalCalculation}
          disabled={foodItems.length === 0}
        >
          Use This Total
        </Button>
      )}
      
      {!isListening && foodItems.length === 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          Click Start and speak the names of food items and their carb values.
          Say "total" when done to calculate the sum.
        </p>
      )}
    </div>
  );
}
