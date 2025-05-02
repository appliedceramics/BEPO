import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { convertBgToMgdl } from "@/lib/correctionCalculator";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { calculateInsulin, CalculationResult } from "@/lib/insulinCalculator";
import { Loader2, Mic } from "lucide-react";
import { MealType, Profile } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInput } from "../components/VoiceInput";
import { extractNumber, extractOperation, extractCommand, calculateCarbTotal } from "@/lib/useVoiceInput";
import { TypingEffect } from "../components/TypingEffect";
import { VoiceInstructions } from "../components/VoiceInstructions";

// Custom typing effect for calculator display
const DisplayTypingEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let currentIndex = 0;
    let timerId: NodeJS.Timeout | null = null;
    
    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
        timerId = setTimeout(typeNextChar, 50);
      }
    };
    
    // Start typing
    typeNextChar();
    
    // Clean up on unmount or when text changes
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [text]);
  
  return <span className="digital-display">{displayedText}</span>;
};

export default function FunCalculatorPage() {
  const { user } = useAuth();
  // Dummy toast function that does nothing - disables notifications
  const toast = () => {};
  
  const [displayValue, setDisplayValue] = useState("Select Dosage Purpose");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [shouldUseTypewriter, setShouldUseTypewriter] = useState(false); // Control typewriter effect for display
  
  // Blood glucose and carb inputs for insulin calculation
  const [bgValue, setBgValue] = useState<number | null>(null);
  const [carbValue, setCarbValue] = useState<number | null>(null);
  const [mealType, setMealType] = useState<MealType | "">(); 
  const [carbTotalMode, setCarbTotalMode] = useState(false);
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState<'purpose' | 'bg' | 'carbs' | 'done' | 'ai-search'>('purpose');
  
  // State for AI food search
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [foodSearchResults, setFoodSearchResults] = useState<any[]>([]);
  const [isFoodSearchLoading, setIsFoodSearchLoading] = useState<boolean>(false);
  const [displayText, setDisplayText] = useState("Select Dosage");
  const [typingText, setTypingText] = useState("");
  const [showTypingEffect, setShowTypingEffect] = useState(true);
  const [bgButtonActive, setBgButtonActive] = useState(false);
  const [carbButtonActive, setCarbButtonActive] = useState(false);
  const [purposeButtonsActive, setPurposeButtonsActive] = useState(true);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  
  // Voice input states - disabled by default
  type VoiceInputModeType = 'none' | 'bg' | 'carb-total';
  const [voiceInputMode, setVoiceInputMode] = useState<VoiceInputModeType>('none');
  const [showVoiceInstructions, setShowVoiceInstructions] = useState(false);
  
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

  // Update wizard steps based on user actions
  useEffect(() => {
    if (mealType) {
      // For long-acting insulin, skip BG input and use fixed dosage
      if (mealType === "longActing" && settings?.longActingDosage) {
        setWizardStep('done');
        setDisplayText(`Your 24-Hour insulin dosage is ${settings.longActingDosage} units`);
        setShowTypingEffect(true);
        
        // Set a default BG value since it's not needed for calculation
        const defaultBg = 5.6; // Default target BG
        setBgValue(defaultBg);
        
        // Update display to show the fixed dosage
        setDisplayValue(settings.longActingDosage.toString());
        setShouldUseTypewriter(true); // Enable typewriter effect
        
        // Update button states
        setBgButtonActive(false);
        setCarbButtonActive(false);
        setPurposeButtonsActive(false);

        // Show toast with dosage info - disabled
        toast();
      } 
      // For all other meal types, proceed normally
      else {
        setWizardStep('bg');
        setDisplayText("Enter Current BG Count & Press Current BG");
        setShowTypingEffect(true);
        setBgButtonActive(true);
        setCarbButtonActive(false);
        setPurposeButtonsActive(false); // Stop pulsing purpose buttons when one is selected
        // Auto clear display for number entry
        setDisplayValue("0");
      }
    }
  }, [mealType, settings]);
  
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
        toast();
      } else {
        // For all other meal types, proceed to carb counting
        setWizardStep('carbs');
        setDisplayText("Now, add-up & total carb count, then press Carb Total");
        setShowTypingEffect(true);
        setBgButtonActive(false);
        setCarbButtonActive(true);
        // Auto clear display for number entry
        setDisplayValue("0");
        setShouldUseTypewriter(false);
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
        
        toast();
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
  
  // Initialize calculated insulin values
  const [insulinCalcResult, setInsulinCalcResult] = useState({
    mealInsulin: 0,
    correctionInsulin: 0,
    totalInsulin: 0,
    bgMgdl: 0,
    calculationMethod: ""
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
      setShouldUseTypewriter(true); // Enable typewriter effect
    } else {
      // Apply typewriter effect to newly entered numbers
      const newDisplayValue = displayValue === "0" || displayValue === "Select Dosage" ? digit : displayValue + digit;
      setDisplayValue(newDisplayValue);
      setShouldUseTypewriter(true); // Enable typewriter effect
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
      setShouldUseTypewriter(true); // Enable typewriter effect
      return;
    }

    if (!displayValue.includes(".")) {
      // Handle special display values
      if (displayValue === "Select Dosage") {
        setDisplayValue("0.");
      } else {
        setDisplayValue(displayValue + ".");
      }
      setShouldUseTypewriter(true); // Enable typewriter effect
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
      setShouldUseTypewriter(true); // Enable typewriter effect
      
      // Add final calculation to history
      const operatorSymbol = operation === '+' ? '+' : operation === '-' ? '-' : operation === '*' ? '×' : '÷';
      setCalculationHistory([...calculationHistory, `${operatorSymbol} ${inputValue}`, `= ${result}`]);

      // No longer setting carb value here - user will press Carb Total button again to set
    } else if (wizardStep === 'carbs' && !carbValue && !carbTotalMode) {
      // In the carbs step but with no calculation, set the direct value
      // Only do this if not in Carb Total mode
      setCarbValue(inputValue);
      toast();
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
    setDisplayValue("Select Dosage");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForSecondOperand(false);
    setCalculationHistory([]);
    
    // Reset wizard to initial state
    setWizardStep('purpose');
    setDisplayText("Select Dosage");
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
    
    toast();
  };

  // Calculate insulin when inputs change
  useEffect(() => {
    // Check if we can calculate insulin based on inputs
    if (settings && mealType) {
      // For long-acting insulin, we don't need blood glucose values
      const canCalculate = mealType === 'longActing' || bgValue;
      
      if (canCalculate) {
        try {
          console.log('Calculator detected input change - mealType:', mealType, 'carbValue:', carbValue, 'bgValue:', bgValue);
  
          // Calculate insulin doses using default values if settings are missing
          const calculationParams: any = {
            mealType: mealType as MealType,
            insulinToCarbohydrateRatio: settings?.insulinToCarbohydrateRatio || 10,
            targetBgValue: settings?.targetBgValue || 5.6,
            correctionFactor: settings?.correctionFactor || 1.0,
            insulinSensitivityFactor: settings?.insulinSensitivityFactor || 35
          };
          
          // For non-long-acting insulin, we need BG value and possibly carb value
          if (mealType !== 'longActing') {
            // Convert bg value if needed
            calculationParams.bgValue = bgValue;
            calculationParams.carbValue = carbValue || undefined;
          } else {
            // For long-acting insulin, add the fixed dosage from settings
            calculationParams.longActingDosage = settings?.longActingDosage || 0;
          }
  
          const result = calculateInsulin(calculationParams);
  
          // Set calculated results
          setInsulinCalcResult({
            mealInsulin: result.mealInsulin,
            correctionInsulin: result.correctionInsulin,
            totalInsulin: result.totalInsulin,
            bgMgdl: result.bgMgdl,
            calculationMethod: result.calculationMethod || ""
          });
        } catch (error) {
          console.error("Error calculating insulin:", error);
        }
      }
    }
  }, [mealType, bgValue, carbValue, settings, profile]);

  // Use current display value for insulin calculation inputs
  const setAsBloodGlucose = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value)) {
      setBgValue(value);
      toast();
    }
  };

  const setAsCarbs = () => {
    // Don't allow setting carbs for bedtime
    if (mealType === 'bedtime') {
      toast();
      return;
    }
    
    const value = parseFloat(displayValue);
    if (!isNaN(value)) {
      setCarbValue(value);
      toast();
    }
  };

  // Voice input handling - disabled but keeping function for compatibility
  const startVoiceInput = (inputType: 'bg' | 'carbs') => {
    console.log("Voice input disabled");
  };
  
  // Play a soft success sound
  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6 note
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05); // Very quiet
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Voice-related functions kept for compatibility but disabled
  const processVoiceCarbTotal = () => {
    console.log("Voice input disabled");
  };

  // For calculating the current display value (used in carb total)
  const calculateFromDisplay = (): number | null => {
    // If there's an active operation, perform the calculation
    if (previousValue !== null && operation) {
      const currentValue = parseFloat(displayValue);
      if (!isNaN(currentValue)) {
        return performCalculation(operation, previousValue, currentValue);
      }
    }
    
    // Otherwise, just return the current display value
    const value = parseFloat(displayValue);
    return isNaN(value) ? null : value;
  };
  
  // Toggle carb total mode
  const toggleCarbTotalMode = () => {
    if (wizardStep === 'purpose' || wizardStep === 'bg') {
      // Can't activate carb total mode until we're ready
      toast();
      return;
    }
    
    if (carbTotalMode) {
      // Ready to set the carb value
      const value = parseFloat(displayValue);
      if (!isNaN(value)) {
        setCarbValue(value);
        toast();
      }
    } else {
      setCarbTotalMode(true);
      // Clear calculator for new calculation
      setDisplayValue("0");
      setPreviousValue(null);
      setOperation(null);
      setWaitingForSecondOperand(false);
      setCalculationHistory([]);
      toast();
    }
  };
  
  // Handle voice input results (function kept for compatibility but unused)
  const handleVoiceResult = (transcript: string) => {
    console.log("Voice input disabled");
  };
  
  // Voice input start notification - kept for compatibility but unused
  const notifyVoiceInputStarted = () => {
    console.log("Voice input disabled");
  };
  
  // AI food search
  const openAIFoodSearch = () => {
    setWizardStep('ai-search');
    setFoodSearchQuery("");
    setFoodSearchResults([]);
    toast();
  };
  
  const closeAIFoodSearch = () => {
    setWizardStep(bgValue ? 'carbs' : 'bg');
  };
  
  const searchFoods = async () => {
    if (!foodSearchQuery.trim()) return;
    
    setIsFoodSearchLoading(true);
    
    try {
      const response = await fetch('/api/food-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: foodSearchQuery })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFoodSearchResults([data]); // API returns a single detailed result
      } else {
        console.error("Failed to search foods:", await response.text());
      }
    } catch (error) {
      console.error("Error searching foods:", error);
    } finally {
      setIsFoodSearchLoading(false);
    }
  };
  
  const selectFoodPortion = (carbValue: number) => {
    setWizardStep('carbs');
    setDisplayValue(String(carbValue));
    setCarbValue(carbValue);
    setShouldUseTypewriter(true); // Enable typewriter effect
    toast();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
      <Navigation />
      
      <div className="flex-1 container py-4 px-2 sm:px-4 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold mb-4 text-gray-800">BEPO Insulin Calculator</h1>
        
        <Card className="bg-white border border-gray-300 shadow-lg overflow-hidden">
          <div className="bg-gray-800 p-4 rounded-t-lg">
            <div className="calculator-display bg-gray-900 rounded-lg p-3 shadow-inner overflow-hidden digital-display-container">
              {/* Instruction text with typing effect if active */}
              {showTypingEffect ? (
                <TypingEffect 
                  text={displayText} 
                  speed={40} 
                  className="digital-display text-sm" 
                  onComplete={() => setShowTypingEffect(false)}
                />
              ) : (
                <div className="digital-display text-sm">{displayText}</div>
              )}
              {/* Calculator display for values with typewriter effect */}
              <div className="flex justify-between items-center mt-2">
                <div className="text-right text-3xl w-full">
                  {displayValue === "Select Dosage" ? "" : (
                    shouldUseTypewriter ? (
                      <DisplayTypingEffect text={displayValue} />
                    ) : (
                      <span className="digital-display">{displayValue}</span>
                    )
                  )}
                </div>
              </div>
              {/* Calculation history */}
              {calculationHistory.length > 0 && (
                <div className="text-xs digital-display mt-2 text-right opacity-80">
                  {calculationHistory.join(' ')}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-3 bg-gray-300">
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
                    </div>
                  </button>
                </motion.div>
                
                <motion.div 
                  animate={carbButtonActive ? { scale: [1, 1.05, 1] } : {}} 
                  transition={carbButtonActive ? { repeat: Infinity, duration: 1 } : {}}
                  className="h-14 relative"
                >
                  {/* Voice instructions for carb total */}
                  <AnimatePresence>
                    {voiceInputMode === 'carb-total' && showVoiceInstructions && (
                      <div className="absolute bottom-full left-0 w-full mb-2 z-10">
                        <VoiceInstructions isVisible={true} type="carb-total" />
                      </div>
                    )}
                  </AnimatePresence>
                  
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
                    </div>
                  </button>
                </motion.div>
              </div>
              
              {/* Clear and AI Food Search - Third row */}
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
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-lg h-10 col-span-3 flex items-center justify-center shadow-lg"
                  onClick={openAIFoodSearch}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="mr-1">🔍</span> AI Food Search
                </motion.button>
              </div>
              
              {/* Number pad and operators - Exact layout as in reference image */}
              <div className="grid grid-cols-4 gap-2 grid-rows-[repeat(4,minmax(0,auto))]">
                {/* Row 1: 7 8 9 divide/multiply (shared button) */}
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
                <div className="h-12 bg-gradient-to-b from-green-600 to-emerald-700 rounded-lg grid grid-cols-2 overflow-hidden shadow-md">
                  <motion.button 
                    className="h-full hover:bg-green-700/40 text-white text-xl font-bold flex items-center justify-center border-r border-green-800/30"
                    onClick={() => handleOperator("/")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >÷</motion.button>
                  <motion.button 
                    className="h-full bg-green-700/30 hover:bg-green-700/40 text-white text-xl font-bold flex items-center justify-center"
                    onClick={() => handleOperator("*")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >×</motion.button>
                </div>
                
                {/* Row 2: 4 5 6 subtract */}
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
                  className="bg-gradient-to-b from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => handleOperator("-")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >−</motion.button>
                
                {/* Row 3: 1 2 3 plus */}
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
                  className="bg-gradient-to-b from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => handleOperator("+")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >+</motion.button>
                
                {/* Row 4: decimal 0 equals */}
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={inputDecimal}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >.</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => inputDigit("0")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >0</motion.button>
                <motion.button 
                  className="bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white text-xl font-bold rounded-lg h-12 col-span-2 flex items-center justify-center shadow-md"
                  onClick={handleEquals}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >=</motion.button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Results display */}
        {wizardStep === 'done' && (
          <Card className="mt-4 bg-white border border-gray-300 shadow-lg overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-2 text-cyan-700">Insulin Dosage:</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {mealType !== 'longActing' ? (
                  <>
                    <div>
                      <p className="text-gray-600 text-sm">Meal Insulin:</p>
                      <p className="text-2xl font-bold text-gray-800">{insulinCalcResult.mealInsulin.toFixed(1)} units</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Correction Insulin:</p>
                      <p className="text-2xl font-bold text-gray-800">{insulinCalcResult.correctionInsulin.toFixed(1)} units</p>
                    </div>
                    <div className="col-span-2 border-t border-gray-300 pt-2 mt-2">
                      <p className="text-gray-600 text-sm">Total Insulin:</p>
                      <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-cyan-600">
                        {insulinCalcResult.totalInsulin.toFixed(1)} units
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <p className="text-gray-600 text-sm">24-Hour Insulin:</p>
                    <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-cyan-600">
                      {settings?.longActingDosage || '0'} units
                    </p>
                  </div>
                )}
              </div>
              
              {mealType !== 'longActing' && (
                <div className="mt-4 text-xs text-gray-600">
                  <p>Method: {insulinCalcResult.calculationMethod}</p>
                  <p className="mt-1">BG in mg/dL: {insulinCalcResult.bgMgdl.toFixed(0)}</p>
                </div>
              )}
            </div>
          </Card>
        )}
        
        {/* AI Food Search Dialog */}
        <AnimatePresence>
          {wizardStep === 'ai-search' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            >
              <Card className="w-full max-w-md bg-white border border-gray-300 shadow-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-cyan-700">AI Food Search</h2>
                    <button 
                      onClick={closeAIFoodSearch}
                      className="text-gray-500 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="flex mb-4">
                    <input
                      type="text"
                      placeholder="Search for a food (e.g., pizza, pasta, apple)"
                      value={foodSearchQuery}
                      onChange={(e) => setFoodSearchQuery(e.target.value)}
                      className="flex-1 bg-gray-100 border border-gray-300 rounded-l-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      onClick={searchFoods}
                      disabled={isFoodSearchLoading}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-r-lg flex items-center justify-center"
                    >
                      {isFoodSearchLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                    </button>
                  </div>
                  
                  {isFoodSearchLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                    </div>
                  ) : foodSearchResults.length > 0 ? (
                    <div className="space-y-4">
                      {foodSearchResults.map((food, index) => (
                        <Card key={index} className="bg-gray-100 border border-gray-300 overflow-hidden">
                          <div className="p-3">
                            <h3 className="font-semibold text-gray-800">{food.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{food.description}</p>
                            
                            <div className="mt-3 space-y-2">
                              <h4 className="text-xs font-medium text-gray-600">Portion Sizes:</h4>
                              <div className="grid grid-cols-3 gap-2">
                                <button 
                                  onClick={() => selectFoodPortion(food.portions.small.carbValue)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs p-2 rounded text-center flex flex-col items-center transition-colors"
                                >
                                  <span className="font-medium">Small</span>
                                  <span className="text-gray-700 mt-1">{food.portions.small.carbValue}g carbs</span>
                                  <span className="text-gray-600 text-xs mt-1">{food.portions.small.description}</span>
                                </button>
                                <button 
                                  onClick={() => selectFoodPortion(food.portions.medium.carbValue)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs p-2 rounded text-center flex flex-col items-center transition-colors"
                                >
                                  <span className="font-medium">Medium</span>
                                  <span className="text-gray-700 mt-1">{food.portions.medium.carbValue}g carbs</span>
                                  <span className="text-gray-600 text-xs mt-1">{food.portions.medium.description}</span>
                                </button>
                                <button 
                                  onClick={() => selectFoodPortion(food.portions.large.carbValue)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs p-2 rounded text-center flex flex-col items-center transition-colors"
                                >
                                  <span className="font-medium">Large</span>
                                  <span className="text-gray-700 mt-1">{food.portions.large.carbValue}g carbs</span>
                                  <span className="text-gray-600 text-xs mt-1">{food.portions.large.description}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : foodSearchQuery ? (
                    <div className="text-center py-8 text-gray-500">
                      No results found. Try a different search term.
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Enter a food name to get carbohydrate information.
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}