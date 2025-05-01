import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Plus, Loader2, Hash, Pizza, Utensils, Apple } from "lucide-react";
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
      // Calculate the total as a number
      const total = foodItems.reduce((sum, item) => sum + item.carbs, 0);
      console.log('TotalForMe calculating final total:', total, 'from items:', foodItems);
      
      toast({
        title: "Total calculated",
        description: `Your total carbs: ${total}g`,
      });
      
      // Pass the numeric value to the callback
      onFinalTotal(Number(total));
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
        <div className="mt-4">
          {listeningStateRef.current === 'food' ? (
            <div className="flex flex-col items-center justify-center p-5 border rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full mb-3 shadow-md">
                <Pizza className="h-12 w-12 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-center mb-1 bg-gradient-to-r from-green-600 to-emerald-700 text-transparent bg-clip-text">Say Food</h3>
              <p className="text-sm text-muted-foreground text-center">Speak the name of a food item</p>
              <Progress value={progress} className="h-2 mt-4 w-full bg-green-200" />
            </div>
          ) : listeningStateRef.current === 'carbs' ? (
            <div className="flex flex-col items-center justify-center p-5 border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full mb-3 shadow-md">
                <Hash className="h-12 w-12 text-white animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-center mb-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-transparent bg-clip-text">Say Carb #</h3>
              <p className="text-sm text-muted-foreground text-center">For <span className="font-semibold text-indigo-700">{currentFoodRef.current}</span>, speak the carb amount</p>
              <Progress value={progress} className="h-2 mt-4 w-full bg-blue-200" />
            </div>
          ) : null}
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
                <div key={index} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center">
                    <span className="bg-accent/20 p-1 rounded-full mr-2">
                      <Utensils className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <Badge variant="outline" className="ml-2">{item.carbs}g</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Total:</span>
              <Badge className="bg-primary">{calculateCurrentTotal()}g</Badge>
            </div>
            <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full mt-2">
              <div 
                className="bg-gradient-to-r from-blue-300 to-purple-400 h-2 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${Math.min(100, (foodItems.length / 5) * 100)}%` }}
              />
            </div>
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
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 rounded-full bg-primary/10 mr-3">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Click Start and use voice commands to add food items and their carb values
            </p>
          </div>
          
          <div className="border rounded-xl p-4 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">Voice Commands</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col items-center p-2 border rounded-lg bg-green-50 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="bg-green-500 p-2 rounded-full mb-1">
                  <Pizza className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-green-700 text-xs">Say a food name</span>
                <span className="text-xs text-muted-foreground">"pizza"</span>
              </div>
              
              <div className="flex flex-col items-center p-2 border rounded-lg bg-blue-50 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="bg-blue-500 p-2 rounded-full mb-1">
                  <Hash className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-blue-700 text-xs">Say a carb amount</span>
                <span className="text-xs text-muted-foreground">"45"</span>
              </div>
              
              <div className="flex flex-col items-center p-2 border rounded-lg bg-amber-50 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="bg-amber-500 p-2 rounded-full mb-1">
                  <Utensils className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-amber-700 text-xs">Say a food name</span>
                <span className="text-xs text-muted-foreground">"french fries"</span>
              </div>
              
              <div className="flex flex-col items-center p-2 border rounded-lg bg-indigo-50 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="bg-indigo-500 p-2 rounded-full mb-1">
                  <Hash className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-indigo-700 text-xs">Say a carb amount</span>
                <span className="text-xs text-muted-foreground">"30"</span>
              </div>
            </div>
            
            <div className="mt-3 text-center border-t pt-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm">
                <span className="text-xs font-medium text-white">Say "total" to finish</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
