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
  const [displayText, setDisplayText] = useState("Why are you taking insulin?");
  const [typingText, setTypingText] = useState("");
  const [showTypingEffect, setShowTypingEffect] = useState(true);
  const [bgButtonActive, setBgButtonActive] = useState(false);
  const [carbButtonActive, setCarbButtonActive] = useState(false);
  const [purposeButtonsActive, setPurposeButtonsActive] = useState(true);
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
      setPurposeButtonsActive(false); // Stop pulsing purpose buttons when one is selected
      // Auto clear display for number entry
      setDisplayValue("0");
    }
  }, [mealType]);
  
  useEffect(() => {
    if (bgValue !== null && wizardStep === 'bg') {
      // For bedtime insulin, we skip the carb counting step since it's not needed
      if (mealType === 'bedtime') {
        setWizardStep('done');
        setDisplayText("Blood glucose set. Calculating correction dose...");
        setShowTypingEffect(true);
        setBgButtonActive(false);
        // Don't activate carb button for bedtime
        setCarbButtonActive(false);
        toast({
          title: "Bedtime Calculation",
          description: "Just using blood glucose for bedtime calculation (no carbs needed)",
        });
      } else {
        // For all other meal types, proceed to carb counting
        setWizardStep('carbs');
        setDisplayText("Now, add-up & total carb count, then press Carb Total");
        setShowTypingEffect(true);
        setBgButtonActive(false);
        setCarbButtonActive(true);
        // Auto clear display for number entry
        setDisplayValue("0");
        // We'll auto-activate Carb Total in a separate effect to avoid the initialization error
      }
    }
  }, [bgValue, wizardStep, mealType]);
  
  // This effect watches for when we transition to carbs step and auto-activates the Carb Total mode
  useEffect(() => {
    if (wizardStep === 'carbs' && !carbTotalMode) {
      const timer = setTimeout(() => {
        setCarbTotalMode(true);
        // Clear display for calculation but keep wizard state and current BG
        setDisplayValue("0");
        setPreviousValue(null);
        setOperation(null);
        setWaitingForSecondOperand(false);
        setCalculationHistory([]);
        
        toast({
          title: "Carb Total Mode Activated",
          description: "Use calculator to add up carb values, then press Carb Total button again to set",
        });
      }, 800); // Small delay to allow transition animation and instructions to show first
      
      return () => clearTimeout(timer);
    }
  }, [wizardStep, carbTotalMode]);
  
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

  // For tracking calculator history
  const [calculationHistory, setCalculationHistory] = useState<string[]>([]);

  // Handle operators (+, -, *, /)
  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      // Add first number to history
      setCalculationHistory([...calculationHistory, inputValue.toString()]);
    } else if (operation) {
      const result = performCalculation(operation, previousValue, inputValue);
      setDisplayValue(String(result));
      setPreviousValue(result);
      
      // Add calculation to history
      const operatorSymbol = operation === '+' ? '+' : operation === '-' ? '-' : operation === '*' ? '×' : '÷';
      setCalculationHistory([...calculationHistory, `${operatorSymbol} ${inputValue}`, `= ${result}`]);
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
      
      // Add final calculation to history
      const operatorSymbol = operation === '+' ? '+' : operation === '-' ? '-' : operation === '*' ? '×' : '÷';
      setCalculationHistory([...calculationHistory, `${operatorSymbol} ${inputValue}`, `= ${result}`]);

      // No longer setting carb value here - user will press Carb Total button again to set
    } else if (wizardStep === 'carbs' && !carbValue && !carbTotalMode) {
      // In the carbs step but with no calculation, set the direct value
      // Only do this if not in Carb Total mode
      setCarbValue(inputValue);
      toast({
        title: "Carbs Set",
        description: `Carbohydrate value set to ${inputValue}g`,
      });
    }
  };

  // Clear entry (just the current display)
  const clearEntry = () => {
    setDisplayValue("0");
    setWaitingForSecondOperand(false);
    setCalculationHistory([]);
  };
  
  // All clear (reset calculator completely)
  const allClear = () => {
    // Clear display and calculation state
    setDisplayValue("Select Dosage Purpose");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForSecondOperand(false);
    setCalculationHistory([]);
    
    // Reset wizard to initial state
    setWizardStep('purpose');
    setDisplayText("Why are you taking insulin?");
    setShowTypingEffect(true);
    
    // Clear blood glucose and carb values
    setBgValue(null);
    setCarbValue(null);
    
    // Reset meal type
    setMealType(undefined);
    
    // Reset button states
    setBgButtonActive(false);
    setCarbButtonActive(false);
    setPurposeButtonsActive(true);
    
    // Exit carb total mode if active
    setCarbTotalMode(false);
    
    toast({
      title: "Calculator Reset",
      description: "Calculator has been reset completely",
    });
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
    // Don't allow setting carbs for bedtime
    if (mealType === 'bedtime') {
      toast({
        title: "Not Needed for Bedtime",
        description: "Carbohydrate counting is not needed for bedtime insulin",
        variant: "destructive"
      });
      return;
    }
    
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
    // Don't allow carb voice input for bedtime
    if (inputType === 'carbs' && mealType === 'bedtime') {
      toast({
        title: "Not Needed for Bedtime",
        description: "Carbohydrate counting is not needed for bedtime insulin",
        variant: "destructive"
      });
      return;
    }
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
    // Don't allow carb total mode for bedtime
    if (mealType === 'bedtime') {
      toast({
        title: "Not Needed for Bedtime",
        description: "Carbohydrate counting is not needed for bedtime insulin",
        variant: "destructive"
      });
      return;
    }
    
    if (!carbTotalMode) {
      setCarbTotalMode(true);
      toast({
        title: "Carb Total Mode Activated",
        description: "Use calculator to add up carb values, then press Carb Total button again to set",
      });
      // Clear display for calculation but keep wizard state and current BG
      setDisplayValue("0");
      setPreviousValue(null);
      setOperation(null);
      setWaitingForSecondOperand(false);
    } else {
      // If already in carb total mode, this will finalize the calculation
      const total = parseFloat(displayValue);
      if (!isNaN(total)) {
        setCarbValue(total);
        toast({
          title: "Carb Total Set",
          description: `Carbohydrate value set to ${total}g`,
        });
        
        // Show completion message with typewriter effect
        setDisplayText("Great! Now take your dosage.");
        setShowTypingEffect(true);
        
        // Scroll to bottom to see results after a short delay
        setTimeout(() => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        }, 500);
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-3 text-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent font-extrabold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>BEPO</span> Fun Calc
            </h1>
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
                <div className={wizardStep !== 'purpose' ? "text-green-300 text-sm" : "text-white text-sm"}>{displayText}</div>
              )}
              {/* Calculator display for values */}
              <div className="text-right text-3xl mt-2">
                {displayValue === "Select Dosage Purpose" ? "" : displayValue}
              </div>
              {/* Calculation history */}
              {calculationHistory.length > 0 && (
                <div className="text-xs text-gray-400 mt-2 text-right">
                  {calculationHistory.join(' ')}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-3 bg-gray-800">
            {/* Calculator body with all controls integrated */}
            <div className="flex flex-col gap-2">
              {/* Purpose of Dosage buttons - First row */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                <motion.button 
                  className={`bg-gradient-to-b ${mealType === "first" ? 'from-yellow-600 to-yellow-700 text-white' : 'from-yellow-700 to-yellow-800 text-white'} 
                    hover:from-yellow-500 hover:to-yellow-600 rounded-lg h-16 
                    flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("first" as MealType)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={purposeButtonsActive ? { scale: [1, 1.08, 1] } : {}}
                  transition={purposeButtonsActive ? { repeat: Infinity, duration: 1.2 } : {}}
                >
                  <span className="text-center text-lg" style={{ fontFamily: 'Arial Narrow, sans-serif' }}>Breakfast</span>
                </motion.button>
                <motion.button 
                  className={`bg-gradient-to-b ${mealType === "other" ? 'from-sky-600 to-sky-700 text-white' : 'from-sky-700 to-sky-800 text-white'} 
                    hover:from-sky-500 hover:to-sky-600 rounded-lg h-16 
                    flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("other" as MealType)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={purposeButtonsActive ? { scale: [1, 1.08, 1] } : {}}
                  transition={purposeButtonsActive ? { repeat: Infinity, duration: 1.2, delay: 0.1 } : {}}
                >
                  <span className="text-center text-lg" style={{ fontFamily: 'Arial Narrow, sans-serif' }}>Lunch / Dinner</span>
                </motion.button>
                <motion.button 
                  className={`bg-gradient-to-b ${mealType === "bedtime" ? 'from-orange-600 to-orange-700 text-white' : 'from-orange-700 to-orange-800 text-white'} 
                    hover:from-orange-500 hover:to-orange-600 rounded-lg h-16 
                    flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("bedtime" as MealType)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={purposeButtonsActive ? { scale: [1, 1.08, 1] } : {}}
                  transition={purposeButtonsActive ? { repeat: Infinity, duration: 1.2, delay: 0.2 } : {}}
                >
                  <span className="text-center text-lg" style={{ fontFamily: 'Arial Narrow, sans-serif' }}>Bedtime Correction</span>
                </motion.button>
                <motion.button 
                  className={`bg-gradient-to-b ${mealType === "longActing" ? 'from-green-600 to-green-700 text-white' : 'from-green-700 to-green-800 text-white'} 
                    hover:from-green-500 hover:to-green-600 rounded-lg h-16 
                    flex items-center justify-center shadow-md`}
                  onClick={() => setMealType("longActing" as MealType)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={purposeButtonsActive ? { scale: [1, 1.08, 1] } : {}}
                  transition={purposeButtonsActive ? { repeat: Infinity, duration: 1.2, delay: 0.3 } : {}}
                >
                  <span className="text-center text-lg" style={{ fontFamily: 'Arial Narrow, sans-serif' }}>24-Hour Acting</span>
                </motion.button>
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
                      "bg-gradient-to-r from-blue-600 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white font-bold rounded-lg h-full shadow-lg w-full",
                      "flex flex-col relative overflow-hidden",
                      bgButtonActive && "ring-2 ring-yellow-300 ring-opacity-100"
                    )}
                    onClick={setAsBloodGlucose}
                  >
                    <div className="h-full flex">
                      <div className="flex-grow flex items-center justify-center text-sm">
                        <span className="mr-1">📊</span> 
                        Current BG {bgValue ? `(${bgValue})` : ''}
                      </div>
                      <div 
                        className="bg-gradient-to-b from-blue-700 to-indigo-900 w-12 flex items-center justify-center text-xs cursor-pointer"
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
                      `${carbTotalMode ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-amber-400 to-yellow-400'} hover:from-amber-600 hover:to-yellow-600 text-white font-bold rounded-lg h-full shadow-lg w-full`,
                      "flex flex-col relative overflow-hidden",
                      carbButtonActive && "ring-2 ring-yellow-300 ring-opacity-100"
                    )}
                    onClick={toggleCarbTotalMode}
                  >
                    <div className="h-full flex">
                      <div className="flex-grow flex items-center justify-center text-sm">
                        <span className="mr-1">🍽️</span>
                        Carb Total {carbValue ? `(${carbValue}g)` : ''}
                      </div>
                      <div 
                        className="bg-gradient-to-b from-amber-600 to-yellow-700 w-12 flex items-center justify-center text-xs cursor-pointer"
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
              <div className="grid grid-cols-7 gap-2 mb-2">
                <motion.button 
                  className="bg-gradient-to-r from-slate-800 to-red-900 hover:from-slate-700 hover:to-red-800 text-white text-xs font-bold rounded-lg h-10 col-span-2 flex items-center justify-center shadow-lg"
                  onClick={allClear}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-center font-bold">AC</span>
                </motion.button>
                <motion.button 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs font-bold rounded-lg h-10 col-span-2 flex items-center justify-center shadow-lg"
                  onClick={clearEntry}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="mr-1">🗑️</span> C
                </motion.button>
                <motion.button
                  className={`${carbTotalMode ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600' : 'bg-gradient-to-r from-purple-500 to-fuchsia-500'} hover:from-purple-700 hover:to-fuchsia-700 text-white text-xs font-bold rounded-lg h-10 col-span-3 flex items-center justify-center shadow-lg`}
                  onClick={handleTotalForMe}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="mr-1">🧩</span> Total For Me
                </motion.button>
              </div>
              
              {/* Number pad and operators - Compact layout */}
              <div className="grid grid-cols-4 gap-2">
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("7")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >7</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("8")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >8</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("9")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >9</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => handleOperator("/")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >÷</motion.button>
                
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("4")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >4</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("5")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >5</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("6")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >6</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => handleOperator("*")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >×</motion.button>
                
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("1")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >1</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("2")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >2</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("3")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >3</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => handleOperator("-")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >-</motion.button>
                
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("0")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >0</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={inputDecimal}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >.</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-purple-600 to-fuchsia-700 hover:from-purple-700 hover:to-fuchsia-800 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={handleEquals}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >=</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => handleOperator("+")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >+</motion.button>
              </div>
              
              {/* Insulin calculation results */}
              {mealType && bgValue ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-gray-700 to-gray-800 p-4 rounded-lg shadow-lg mt-3 text-white border border-gray-600"
                >
                  <div className="text-center mb-2 text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                    Calculation Results
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-bold flex items-center"><span className="mr-1">📈</span> Blood Glucose:</div>
                    <div className="bg-gray-800 px-2 py-1 rounded font-medium text-cyan-300">{bgValue} {profile?.bgUnit || 'mmol/L'}</div>
                    
                    {carbValue !== null && (
                      <>
                        <div className="font-bold flex items-center"><span className="mr-1">🍞</span> Carbs:</div>
                        <div className="bg-gray-800 px-2 py-1 rounded font-medium text-amber-300">{carbValue}g</div>
                        
                        <div className="font-bold flex items-center"><span className="mr-1">💉</span> Meal Insulin:</div>
                        <div className="bg-gray-800 px-2 py-1 rounded font-medium text-pink-300">{insulinCalcResult.mealInsulin.toFixed(1)} units</div>
                      </>
                    )}
                    
                    <div className="font-bold flex items-center"><span className="mr-1">⚙️</span> Correction:</div>
                    <div className="bg-gray-800 px-2 py-1 rounded font-medium text-blue-300">{insulinCalcResult.correctionInsulin.toFixed(1)} units</div>
                    
                    <div className="font-bold flex items-center text-lg col-span-2 mt-2 border-t border-gray-600 pt-2 justify-center">
                      <span className="mr-2">💪</span> Total Insulin
                    </div>
                    <motion.button 
                      className="col-span-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 p-3 rounded-lg text-center text-xl font-bold relative overflow-hidden cursor-pointer shadow-lg border border-green-300"
                      onClick={() => {
                        // Log and notify about insulin dose
                        const logData = {
                          mealType,
                          bgValue,
                          carbValue,
                          insulinDose: insulinCalcResult.totalInsulin,
                          mealInsulin: insulinCalcResult.mealInsulin,
                          correctionInsulin: insulinCalcResult.correctionInsulin,
                          timestamp: new Date().toISOString(),
                        };
                        
                        // This would actually save to API in a real implementation
                        toast({
                          title: "Insulin Logged & Contacts Notified",
                          description: `Logged ${insulinCalcResult.totalInsulin.toFixed(1)} units and notified contacts`
                        });
                        
                        // Reset display with success message
                        setDisplayText("Dosage Logged Successfully!");
                        setShowTypingEffect(true);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      // Add pulsing effect to draw attention to the button
                      animate={{ boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 0 10px rgba(34, 197, 94, 0)'], scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <div className="flex flex-col">
                        <span className="text-white">{insulinCalcResult.totalInsulin.toFixed(1)} units</span>
                        <div className="flex items-center justify-center mt-1">
                          <span className="text-xs text-white/90 font-medium bg-green-700/50 px-2 py-1 rounded-full inline-flex items-center">
                            <span className="mr-1">👆</span> Click to Log & Notify
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center text-gray-400 italic text-sm mt-4 p-2">
                  <span className="mr-2">💪</span>
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
