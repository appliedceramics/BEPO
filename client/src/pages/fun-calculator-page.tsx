import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { convertBgToMgdl } from "@/lib/correctionCalculator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { calculateInsulin, CalculationResult } from "@/lib/insulinCalculator";
import { Loader2, Mic } from "lucide-react";
import { MealType, Profile } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function FunCalculatorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayValue, setDisplayValue] = useState("Select Dosage Purpose");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  
  // Blood glucose and carb inputs for insulin calculation
  const [bgValue, setBgValue] = useState<number | null>(null);
  const [carbValue, setCarbValue] = useState<number | null>(null);
  const [mealType, setMealType] = useState<MealType | "">();
  const [carbTotalMode, setCarbTotalMode] = useState(false);
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState<'purpose' | 'bg' | 'carbs' | 'done'>('purpose');
  const [displayText, setDisplayText] = useState("Select Dosage Purpose");
  const [typingText, setTypingText] = useState("");
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [bgButtonActive, setBgButtonActive] = useState(false);
  const [carbButtonActive, setCarbButtonActive] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  
  // Typewriter effect for display text
  useEffect(() => {
    if (showTypingEffect) {
      let currentText = "";
      let index = 0;
      
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
      
      typewriterRef.current = setInterval(() => {
        if (index < displayText.length) {
          currentText += displayText.charAt(index);
          setTypingText(currentText);
          index++;
        } else {
          if (typewriterRef.current) {
            clearInterval(typewriterRef.current);
          }
          setShowTypingEffect(false);
        }
      }, 50); // Speed of typing
      
      return () => {
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
        }
      };
    }
  }, [showTypingEffect, displayText]);
  
  // Update wizard steps based on user actions
  useEffect(() => {
    if (mealType) {
      setWizardStep('bg');
      setDisplayText("Enter Current BG Count & Press Current BG");
      setShowTypingEffect(true);
      setBgButtonActive(true);
      setCarbButtonActive(false);
      // Auto clear display for number entry
      setDisplayValue("0");
    }
  }, [mealType]);
  
  useEffect(() => {
    if (bgValue !== null && wizardStep === 'bg') {
      setWizardStep('carbs');
      setDisplayText("Now, add-up your carb count and press = when done");
      setShowTypingEffect(true);
      setBgButtonActive(false);
      setCarbButtonActive(true);
      // Auto clear display for number entry
      setDisplayValue("0");
    }
  }, [bgValue, wizardStep]);
  
  // Auto clear display after = in carb total mode
  useEffect(() => {
    if (carbValue !== null && wizardStep === 'carbs') {
      setWizardStep('done');
      setCarbButtonActive(false);
      // Delay clearing display to show the result first
      setTimeout(() => {
        setDisplayValue("0");
      }, 1500);
    }
  }, [carbValue, wizardStep]);

  // Track state changes for debugging
  useEffect(() => {
    console.log("State updated: mealType =", mealType, ", carbValue =", carbValue, ", bgValue =", bgValue);
  }, [mealType, carbValue, bgValue]);
  
  // Get user profile for unit preference
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  // Get calculator settings
  const { data: settings, isLoading: settingsLoading } = useQuery<any>({
    queryKey: ["/api/calculator-settings"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  // Initialize calculated insulin values
  const [insulinCalcResult, setInsulinCalcResult] = useState({
    mealInsulin: 0,
    correctionInsulin: 0,
    totalInsulin: 0,
    bgMgdl: 0,
  });

  // Handle number input
  const inputDigit = (digit: string) => {
    // Don't do anything in purpose selection mode
    if (wizardStep === 'purpose' && !mealType) {
      return;
    }
    
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === "0" || displayValue === "Select Dosage Purpose" ? digit : displayValue + digit);
    }
  };

  // Handle decimal point
  const inputDecimal = () => {
    // Don't do anything in purpose selection mode
    if (wizardStep === 'purpose' && !mealType) {
      return;
    }
    
    if (waitingForSecondOperand) {
      setDisplayValue("0.");
      setWaitingForSecondOperand(false);
      return;
    }

    if (!displayValue.includes(".")) {
      // Handle special display values
      if (displayValue === "Select Dosage Purpose") {
        setDisplayValue("0.");
      } else {
        setDisplayValue(displayValue + ".");
      }
    }
  };

  // Handle operators (+, -, *, /)
  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = performCalculation(operation, previousValue, inputValue);
      setDisplayValue(String(result));
      setPreviousValue(result);
    }

    setWaitingForSecondOperand(true);
    setOperation(nextOperator);
  };

  // Perform calculation
  const performCalculation = (op: string, firstOperand: number, secondOperand: number): number => {
    switch (op) {
      case "+":
        return firstOperand + secondOperand;
      case "-":
        return firstOperand - secondOperand;
      case "*":
        return firstOperand * secondOperand;
      case "/":
        return firstOperand / secondOperand;
      default:
        return secondOperand;
    }
  };

  // Handle equals
  const handleEquals = () => {
    // Don't do anything in purpose selection mode
    if (wizardStep === 'purpose' && !mealType) {
      return;
    }
    
    const inputValue = parseFloat(displayValue);

    if (isNaN(inputValue)) {
      return; // Don't do anything if the display doesn't contain a valid number
    }

    if (previousValue !== null && operation) {
      const result = performCalculation(operation, previousValue, inputValue);
      setDisplayValue(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForSecondOperand(false);

      // If in carb total mode, this finalizes the calculation
      if (carbTotalMode) {
        setCarbValue(result);
        setCarbTotalMode(false);
        toast({
          title: "Carb Total Set",
          description: `Carbohydrate value set to ${result}g`,
        });
      }
    } else if (wizardStep === 'carbs' && !carbValue) {
      // In the carbs step but with no calculation, set the direct value
      setCarbValue(inputValue);
      toast({
        title: "Carbs Set",
        description: `Carbohydrate value set to ${inputValue}g`,
      });
    }
  };

  // Clear calculator
  const clearCalculator = () => {
    setDisplayValue("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForSecondOperand(false);
  };

  // Calculate insulin when inputs change
  useEffect(() => {
    // Only calculate if we have all necessary inputs
    if (settings && mealType && bgValue) {
      try {
        // Convert bg value if needed
        const bgMgdl = profile?.bgUnit === "mmol/L" ? convertBgToMgdl(bgValue) : bgValue;

        console.log('Calculator detected input change - mealType:', mealType, 'carbValue:', carbValue, 'bgValue:', bgValue);

        // Calculate insulin doses using default values if settings are missing
        const result = calculateInsulin({
          mealType: mealType as MealType,
          bgValue: bgValue,
          carbValue: carbValue || undefined,
          insulinToCarbohydrateRatio: settings?.insulinToCarbohydrateRatio || 10,
          targetBgValue: settings?.targetBgValue || 5.6,
          correctionFactor: settings?.correctionFactor || 1.0,
          insulinSensitivityFactor: settings?.insulinSensitivityFactor || 35
        });

        // Set calculated results
        setInsulinCalcResult({
          mealInsulin: result.mealInsulin,
          correctionInsulin: result.correctionInsulin,
          totalInsulin: result.totalInsulin,
          bgMgdl: result.bgMgdl,
        });
      } catch (error) {
        console.error("Error calculating insulin:", error);
      }
    }
  }, [mealType, bgValue, carbValue, settings, profile]);

  // Use current display value for insulin calculation inputs
  const setAsBloodGlucose = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value)) {
      setBgValue(value);
      toast({
        title: "Blood Glucose Set",
        description: `Blood glucose value set to ${value} ${profile?.bgUnit || "mmol/L"}`,
      });
    }
  };

  const setAsCarbs = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value)) {
      setCarbValue(value);
      toast({
        title: "Carbs Set",
        description: `Carbohydrate value set to ${value}g`,
      });
    }
  };

  // Voice input handling
  const startVoiceInput = (inputType: 'bg' | 'carbs') => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore - Speech recognition API not fully typed in TypeScript
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Try to parse number from speech
        const match = transcript.match(/\d+(\.\d+)?/);
        if (match) {
          const value = parseFloat(match[0]);
          if (!isNaN(value)) {
            // Update calculator display
            setDisplayValue(value.toString());
            
            // Set the appropriate value based on input type
            if (inputType === 'bg') {
              setBgValue(value);
              toast({
                title: "Voice Input: Blood Glucose",
                description: `Set to ${value} ${profile?.bgUnit || 'mmol/L'}`,
              });
            } else {
              setCarbValue(value);
              toast({
                title: "Voice Input: Carbs",
                description: `Set to ${value}g`,
              });
            }
          }
        }
      };
      
      recognition.onend = () => {
        toast({
          title: "Voice Input Ended",
          description: inputType === 'bg' ? "Blood glucose voice input complete" : "Carbs voice input complete",
        });
      };
      
      recognition.onerror = (event: any) => {
        toast({
          title: "Voice Input Error",
          description: event.error,
          variant: "destructive",
        });
      };
      
      // Start listening
      recognition.start();
      toast({
        title: "Voice Input Started",
        description: inputType === 'bg' ? "Speak blood glucose value" : "Speak carbohydrate value",
      });
    } else {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive",
      });
    }
  };

  // Calculate total for me (use display value for all fields)
  const calculateTotalForMe = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value)) {
      setBgValue(value);
      setCarbValue(value);
      setMealType("first" as MealType);
      toast({
        title: "Total For Me",
        description: `Using ${value} for both blood glucose and carbs`,
      });
    }
  };

  // Handle carb total mode toggle
  const toggleCarbTotalMode = () => {
    if (!carbTotalMode) {
      setCarbTotalMode(true);
      toast({
        title: "Carb Total Mode Activated",
        description: "Use calculator to add up carb values, then press '=' for total",
      });
      // Clear calculator to start fresh
      clearCalculator();
    } else {
      // If already in carb total mode, this will finalize the calculation
      const total = parseFloat(displayValue);
      if (!isNaN(total)) {
        setCarbValue(total);
        toast({
          title: "Carb Total Set",
          description: `Carbohydrate value set to ${total}g`,
        });
      }
      setCarbTotalMode(false);
    }
  };

  // Validate Total For Me button
  const handleTotalForMe = () => {
    if (!carbTotalMode) {
      toast({
        title: "Action Required",
        description: "Please press 'Carb Total' button first",
        variant: "destructive",
      });
      return;
    }
    
    calculateTotalForMe();
  };

  if (profileLoading || settingsLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <div className="flex-1 flex justify-center items-center p-4 bg-gradient-to-b from-blue-50 to-purple-50">
        <div className="w-full max-w-md bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Calculator header - TITLE */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 text-center">
            <h1 className="text-2xl font-bold text-white">BEPO Fun Calculator</h1>
          </div>
          
          {/* Display area with wizard instructions */}
          <div className="p-3 bg-gray-900">
            <div className="text-right text-gray-400 mb-1 text-xs">
              {carbTotalMode ? "CARB TOTAL MODE" : ""}
            </div>
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 text-left min-h-[80px] text-xl font-bold text-white mb-3 flex flex-col justify-between">
              {/* Wizard instructions with typewriter effect */}
              {showTypingEffect ? (
                <div className="text-green-300">{typingText}<span className="animate-pulse">|</span></div>
              ) : (
                <div className={wizardStep !== 'purpose' ? "text-green-300" : "text-white"}>{displayText}</div>
              )}
              {/* Calculator display for values */}
              <div className="text-right text-3xl mt-2">
                {displayValue === "Select Dosage Purpose" ? "" : displayValue}
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-800">
            {/* Calculator body with all controls integrated */}
            <div className="flex flex-col gap-2">
              {/* Purpose of Dosage buttons - First row */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <button 
                  className={`${mealType === "first" ? 'bg-blue-600' : 'bg-blue-400'} hover:bg-blue-500 text-white text-sm font-bold rounded-lg h-14 flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("first" as MealType)}
                >
                  <span className="text-center">Meal 1</span>
                </button>
                <button 
                  className={`${mealType === "other" ? 'bg-blue-600' : 'bg-blue-400'} hover:bg-blue-500 text-white text-sm font-bold rounded-lg h-14 flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("other" as MealType)}
                >
                  <span className="text-center">Other Meal</span>
                </button>
                <button 
                  className={`${mealType === "bedtime" ? 'bg-blue-600' : 'bg-blue-400'} hover:bg-blue-500 text-white text-sm font-bold rounded-lg h-14 flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("bedtime" as MealType)}
                >
                  <span className="text-center">Bedtime</span>
                </button>
                <button 
                  className={`${mealType === "longActing" ? 'bg-green-600' : 'bg-green-500'} hover:bg-green-600 text-white text-sm font-bold rounded-lg h-14 flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("longActing" as MealType)}
                >
                  <span className="text-center">24-Hour</span>
                </button>
              </div>
              
              {/* Current BG and Carb Total - Second row - Combined buttons with voice input */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <motion.div 
                  animate={bgButtonActive ? { scale: [1, 1.05, 1] } : {}} 
                  transition={bgButtonActive ? { repeat: Infinity, duration: 1 } : {}}
                  className="h-14"
                >
                  <button 
                    className={cn(
                      "bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg h-full shadow-md w-full",
                      "flex flex-col relative overflow-hidden",
                      bgButtonActive && "ring-2 ring-white ring-opacity-50"
                    )}
                    onClick={setAsBloodGlucose}
                  >
                    <div className="h-full flex">
                      <div className="flex-grow flex items-center justify-center text-sm">
                        Current BG {bgValue ? `(${bgValue})` : ''}
                      </div>
                      <div 
                        className="bg-teal-600 w-12 flex items-center justify-center text-xs cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          startVoiceInput('bg');
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <Mic className="h-4 w-4 mb-1" /> 
                          <span className="text-[10px]">Voice</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
                
                <motion.div 
                  animate={carbButtonActive ? { scale: [1, 1.05, 1] } : {}} 
                  transition={carbButtonActive ? { repeat: Infinity, duration: 1 } : {}}
                  className="h-14"
                >
                  <button 
                    className={cn(
                      `${carbTotalMode ? 'bg-yellow-600' : 'bg-yellow-500'} hover:bg-yellow-600 text-white font-bold rounded-lg h-full shadow-md w-full`,
                      "flex flex-col relative overflow-hidden",
                      carbButtonActive && "ring-2 ring-white ring-opacity-50"
                    )}
                    onClick={toggleCarbTotalMode}
                  >
                    <div className="h-full flex">
                      <div className="flex-grow flex items-center justify-center text-sm">
                        Carb Total {carbValue ? `(${carbValue}g)` : ''}
                      </div>
                      <div 
                        className="bg-yellow-600 w-12 flex items-center justify-center text-xs cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          startVoiceInput('carbs');
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <Mic className="h-4 w-4 mb-1" /> 
                          <span className="text-[10px]">Voice</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              </div>
              
              {/* Clear and Total For Me - Third row */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <button 
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg h-10 col-span-2 flex items-center justify-center shadow-md"
                  onClick={clearCalculator}
                >
                  CLEAR ENTRY
                </button>
                <button
                  className={`${carbTotalMode ? 'bg-purple-600' : 'bg-purple-500'} hover:bg-purple-600 text-white text-xs font-bold rounded-lg h-10 col-span-2 flex items-center justify-center shadow-md`}
                  onClick={handleTotalForMe}
                >
                  Total For Me
                </button>
              </div>
              
              {/* Number pad and operators - Compact layout */}
              <div className="grid grid-cols-4 gap-2">
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("7")}>7</button>
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("8")}>8</button>
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("9")}>9</button>
                <button className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => handleOperator("/")}>÷</button>
                
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("4")}>4</button>
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("5")}>5</button>
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("6")}>6</button>
                <button className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => handleOperator("*")}>×</button>
                
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("1")}>1</button>
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("2")}>2</button>
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("3")}>3</button>
                <button className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => handleOperator("-")}>-</button>
                
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => inputDigit("0")}>0</button>
                <button className="bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={inputDecimal}>.</button>
                <button className="bg-purple-500 hover:bg-purple-600 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={handleEquals}>=</button>
                <button className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md" onClick={() => handleOperator("+")}>+</button>
              </div>
              
              {/* Insulin calculation results */}
              {mealType && bgValue ? (
                <div className="bg-gray-700 p-3 rounded-lg shadow-inner mt-2 text-white">
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <div className="font-bold">Blood Glucose:</div>
                    <div>{bgValue} {profile?.bgUnit || 'mmol/L'}</div>
                    
                    {carbValue !== null && (
                      <>
                        <div className="font-bold">Carbs:</div>
                        <div>{carbValue}g</div>
                        
                        <div className="font-bold">Meal Insulin:</div>
                        <div>{insulinCalcResult.mealInsulin.toFixed(1)} units</div>
                      </>
                    )}
                    
                    <div className="font-bold">Correction:</div>
                    <div>{insulinCalcResult.correctionInsulin.toFixed(1)} units</div>
                    
                    <div className="font-bold text-green-300">Total Insulin:</div>
                    <div className="text-green-300 font-bold">{insulinCalcResult.totalInsulin.toFixed(1)} units</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 italic text-sm mt-2">
                  Select meal type and enter values to calculate insulin
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
