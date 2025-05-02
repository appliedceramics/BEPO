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
import { motion, AnimatePresence } from "framer-motion";
import { VoiceInput } from "../components/VoiceInput";
import { extractNumber, extractOperation, extractCommand, calculateCarbTotal } from "@/lib/useVoiceInput";
import { TypingEffect } from "../components/TypingEffect";
import { VoiceInstructions } from "../components/VoiceInstructions";

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
  const [wizardStep, setWizardStep] = useState<'purpose' | 'bg' | 'carbs' | 'done' | 'ai-search'>('purpose');
  
  // State for AI food search
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [foodSearchResults, setFoodSearchResults] = useState<any[]>([]);
  const [isFoodSearchLoading, setIsFoodSearchLoading] = useState<boolean>(false);
  const [displayText, setDisplayText] = useState("Why are you taking insulin?");
  const [typingText, setTypingText] = useState("");
  const [showTypingEffect, setShowTypingEffect] = useState(true);
  const [bgButtonActive, setBgButtonActive] = useState(false);
  const [carbButtonActive, setCarbButtonActive] = useState(false);
  const [purposeButtonsActive, setPurposeButtonsActive] = useState(true);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  
  // Voice input states
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
        
        // Update button states
        setBgButtonActive(false);
        setCarbButtonActive(false);
        setPurposeButtonsActive(false);

        // Show toast with dosage info
        toast({
          title: "24-Hour Insulin",
          description: `Fixed dosage: ${settings.longActingDosage} units`
        });
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
    console.log("Starting voice input for:", inputType);
    
    // Don't allow carb voice input for bedtime
    if (inputType === 'carbs' && mealType === 'bedtime') {
      toast({
        title: "Not Needed for Bedtime",
        description: "Carbohydrate counting is not needed for bedtime insulin",
        variant: "destructive"
      });
      return;
    }
    
    // For carb totaling, reset the calculator
    if (inputType === 'carbs') {
      // Reset calculator for carb total
      setDisplayValue("0");
      setPreviousValue(null);
      setOperation(null);
      setWaitingForSecondOperand(false);
      // Set as carb-total mode
      setVoiceInputMode('carb-total');
    } else {
      // Set blood glucose input mode
      setVoiceInputMode('bg');
    }
    
    // Show toast notification and instructions for voice input
    // (setShowVoiceInstructions is now handled inside notifyVoiceInputStarted)
    notifyVoiceInputStarted();
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

  // Process carb total from voice input
  const processVoiceCarbTotal = () => {
    console.log("Processing voice carb total");
    // Process all the numbers that have been spoken so far
    // and add them up for the carb total
    const totalValue = calculateFromDisplay();
    console.log("Calculated total value:", totalValue, "Current display value:", displayValue);
    
    // If we don't have a value from the calculation, try to parse the display value directly
    let finalValue = totalValue;
    if (finalValue === null) {
      try {
        const parsedValue = parseFloat(displayValue);
        if (!isNaN(parsedValue)) {
          console.log("Using parsed display value instead:", parsedValue);
          finalValue = parsedValue;
        }
      } catch (error) {
        console.error("Error parsing display value:", error);
      }
    }
    
    if (finalValue !== null) {
      // Set the carb value and update display
      setCarbValue(finalValue);
      setDisplayValue(finalValue.toString());
      
      // Update the wizard state to done since we've completed the process
      setWizardStep('done');
      
      // Play a success sound
      playSuccessSound();
      
      // Show success toast with the calculation details
      toast({
        title: "Voice Carb Total",
        description: `Calculated ${finalValue}g carbs`
      });
      
      // Clear the voice input state
      setVoiceInputMode('none');
      
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
      
      console.log("Successfully set carb value to:", finalValue);
    } else {
      console.log("Failed to calculate a valid carb total value");
      toast({
        title: "Voice Input Error",
        description: "Could not calculate carb total. Please try again.",
        variant: "destructive"
      });
      // Also deactivate voice input if there's an error
      setVoiceInputMode('none');
    }
  };
  
  // Handle voice input commands and operations
  const handleVoiceCommand = (command: string) => {
    console.log("Voice command received:", command, "Mode:", voiceInputMode);
    
    if (command === 'carbTotal') {
      // Allow carb total command to work in any mode, but log more details if not in carb-total mode
      if (voiceInputMode !== 'carb-total') {
        console.log("WARNING: Carb Total command received but not in carb-total mode!", 
                    "Current mode:", voiceInputMode, 
                    "Will still attempt to process...");
      }
      processVoiceCarbTotal();
    } else {
      console.log("Other command received:", command);
    }
  };
  
  // Process voice input for numbers
  const handleVoiceNumber = (number: string) => {
    // Add the number to the display
    if (voiceInputMode === 'bg') {
      setDisplayValue(number);
    } else if (voiceInputMode === 'carb-total') {
      // In carb-total mode, we add numbers
      if (displayValue === "0" || waitingForSecondOperand) {
        setDisplayValue(number);
        setWaitingForSecondOperand(false);
      } else {
        // Append to existing display
        setDisplayValue(displayValue + number);
      }
    }
  };
  
  // Process voice operations like "plus"
  const handleVoiceOperation = (op: string) => {
    if (voiceInputMode === 'carb-total' && op === '+') {
      handleOperator('+');
    }
  };
  
  // Calculate the sum from the current calculation state
  const calculateFromDisplay = (): number | null => {
    try {
      // If we have a previous value and an operation
      if (previousValue !== null && operation === '+') {
        const inputValue = parseFloat(displayValue);
        if (!isNaN(inputValue)) {
          return previousValue + inputValue;
        }
      }
      
      // If we just have a single value
      const value = parseFloat(displayValue);
      if (!isNaN(value)) {
        return value;
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating from display:', error);
      return null;
    }
  };
  
  // This component is now integrated directly in the return JSX where needed
  
  // Check if browser supports speech recognition
  const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  // Toast notification for voice input start
  const notifyVoiceInputStarted = () => {
    if (hasSpeechRecognition) {
      // Different messages based on the voice input mode
      if (voiceInputMode === 'bg') {
        toast({
          title: "Voice BG Input",
          description: "Speak your blood glucose value",
          duration: 5000,
        });
      } else if (voiceInputMode === 'carb-total') {
        toast({
          title: "Voice Carb Total",
          description: "Say numbers separated by 'plus', then say 'carb total'",
          duration: 5000,
        });
      }
      
      // Show voice instructions unconditionally for better guidance
      setShowVoiceInstructions(true);
      // Auto-hide instructions after 15 seconds
      setTimeout(() => {
        setShowVoiceInstructions(false);
      }, 15000);
    } else {
      // Show a more detailed error message with browser compatibility info
      const isChromium = navigator.userAgent.indexOf('Chrome') > -1;
      const browserInfo = isChromium ? 
        "Voice input works best in Chrome, Edge, or Opera browsers" : 
        "Please try using Chrome, Edge, or Opera browsers";
      
      toast({
        title: "Voice Input Not Supported",
        description: `Your browser doesn't support voice input. ${browserInfo}`,
        variant: "destructive",
        duration: 7000,
      });
    }
    
    console.log("Voice input mode is now:", voiceInputMode);
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

  // AI food search functionality
  const { data: foodSuggestions, isLoading: aiLoading, refetch: searchFood } = useQuery<any>({ 
    queryKey: ['/api/food-suggestions', foodSearchQuery],
    queryFn: async () => {
      if (!foodSearchQuery) return [];
      const response = await fetch('/api/food-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: foodSearchQuery })
      });
      return response.json();
    },
    enabled: false, // We'll trigger manually with refetch
  });

  // Handle search form submit
  const handleFoodSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (foodSearchQuery.trim().length < 2) {
      toast({
        title: "Search Query Required",
        description: "Please enter at least 2 characters",
        variant: "destructive"
      });
      return;
    }
    setIsFoodSearchLoading(true);
    await searchFood();
    setIsFoodSearchLoading(false);
  };
  
  // Handle AI Food Search button
  const openAIFoodSearch = () => {
    // Clear previous search results
    setFoodSearchQuery('');
    setFoodSearchResults([]);
    
    // Update UI state
    setWizardStep('ai-search');
    setDisplayText("Search for foods to find their carb content");
    setShowTypingEffect(true);
    
    toast({
      title: "AI Food Search",
      description: "Enter a food description to get carb values"
    });
  };
  
  // Handle food selection from search
  const handleFoodSelection = (food: any) => {
    if (food && food.portions && food.portions.medium) {
      // Set the carb value from the selected food
      const carbValue = food.portions.medium.carbValue;
      setCarbValue(carbValue);
      setDisplayValue(carbValue.toString());
      
      // Update wizard state
      setWizardStep('done');
      
      toast({
        title: "Food Selected",
        description: `Added ${food.name} (${carbValue}g carbs)`,
      });
    }
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
        {/* Food search dialog */}
        {wizardStep === 'ai-search' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4">
                <h3 className="text-xl font-bold text-white">AI Food Search</h3>
              </div>
              
              <div className="p-4">
                <form onSubmit={handleFoodSearch} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={foodSearchQuery}
                      onChange={(e) => setFoodSearchQuery(e.target.value)}
                      placeholder="Search for food (e.g., 'apple', 'pizza slice')"
                      className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <button 
                      type="submit" 
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 rounded-md" 
                      disabled={isFoodSearchLoading}
                    >
                      {isFoodSearchLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                    </button>
                  </div>
                </form>
                
                <div className="max-h-64 overflow-y-auto">
                  {foodSuggestions && foodSuggestions.length > 0 ? (
                    <div className="space-y-3">
                      {foodSuggestions.map((food: any, index: number) => (
                        <div 
                          key={index} 
                          className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600"
                          onClick={() => handleFoodSelection(food)}
                        >
                          <div className="font-medium text-white">{food.name}</div>
                          <div className="text-gray-300 text-sm">{food.description}</div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                            <div className="bg-gray-800 p-2 rounded text-center">
                              <div className="text-gray-400">Small</div>
                              <div className="text-amber-400">{food.portions.small.carbValue}g</div>
                            </div>
                            <div className="bg-gray-800 p-2 rounded text-center">
                              <div className="text-gray-400">Medium</div>
                              <div className="text-amber-400">{food.portions.medium.carbValue}g</div>
                            </div>
                            <div className="bg-gray-800 p-2 rounded text-center">
                              <div className="text-gray-400">Large</div>
                              <div className="text-amber-400">{food.portions.large.carbValue}g</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isFoodSearchLoading ? (
                    <div className="text-center py-6 text-gray-400">Searching...</div>
                  ) : foodSearchQuery && foodSuggestions?.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">No foods found for '{foodSearchQuery}'</div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">Enter a food to get AI-powered carb information</div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-900 p-4 flex justify-between">
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md" 
                  onClick={() => setWizardStep('carbs')}
                >
                  Cancel
                </button>
                <button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md"
                  onClick={() => setWizardStep('carbs')}
                  disabled={!foodSuggestions || foodSuggestions.length === 0}
                >
                  Manual Entry
                </button>
              </div>
            </div>
          </div>
        )}
        
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
                <TypingEffect 
                  text={displayText} 
                  className="text-green-300"
                  onComplete={() => setShowTypingEffect(false)}
                />
              ) : (
                <div className={wizardStep !== 'purpose' ? "text-green-300 text-sm" : "text-white text-sm"}>{displayText}</div>
              )}
              {/* Calculator display for values with voice input */}
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center">
                  <VoiceInput 
                    onNumberInput={handleVoiceNumber}
                    onOperationInput={handleVoiceOperation}
                    onCommandInput={handleVoiceCommand}
                    enabled={voiceInputMode !== 'none'}
                  />
                </div>
                <div className="text-right text-3xl flex-grow">
                  {displayValue === "Select Dosage Purpose" ? "" : displayValue}
                </div>
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
                  className="bg-gradient-to-b from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={() => handleOperator("-")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >-</motion.button>
                
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
                <div className="row-span-2">
                  {/* Plus button in the red box area as in reference image */}
                  <motion.button 
                    className="bg-gradient-to-b from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-3xl font-bold rounded-lg w-full h-full flex items-center justify-center shadow-md"
                    onClick={() => handleOperator("+")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ minHeight: '6.2rem' }}
                  >+</motion.button>
                </div>
                
                {/* Row 4: decimal 0 = */}
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
                  className="bg-gradient-to-b from-purple-600 to-fuchsia-700 hover:from-purple-700 hover:to-fuchsia-800 text-white text-xl font-bold rounded-lg h-12 flex items-center justify-center shadow-md"
                  onClick={handleEquals}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >=</motion.button>
              </div>
              
              {/* Insulin calculation results */}
              {mealType && (mealType === 'longActing' || bgValue) ? (
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
                    {mealType !== 'longActing' && (
                      <>
                        <div className="font-bold flex items-center"><span className="mr-1">📈</span> Blood Glucose:</div>
                        <div className="bg-gray-800 px-2 py-1 rounded font-medium text-cyan-300">{bgValue} {profile?.bgUnit || 'mmol/L'}</div>
                      </>
                    )}
                    
                    {carbValue !== null && (
                      <>
                        <div className="font-bold flex items-center"><span className="mr-1">🍞</span> Carbs:</div>
                        <div className="bg-gray-800 px-2 py-1 rounded font-medium text-amber-300">{carbValue}g</div>
                        
                        <div className="font-bold flex items-center"><span className="mr-1">💉</span> Meal Insulin:</div>
                        <div className="bg-gray-800 px-2 py-1 rounded font-medium text-pink-300">{insulinCalcResult.mealInsulin.toFixed(1)} units</div>
                      </>
                    )}
                    
                    {mealType !== 'longActing' && (
                      <>
                        <div className="font-bold flex items-center"><span className="mr-1">⚙️</span> Correction:</div>
                        <div className="bg-gray-800 px-2 py-1 rounded font-medium text-blue-300">{insulinCalcResult.correctionInsulin.toFixed(1)} units</div>
                      </>
                    )}
                    
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
                          description: `Logged ${typeof insulinCalcResult.totalInsulin === 'number' ? insulinCalcResult.totalInsulin.toFixed(1) : insulinCalcResult.totalInsulin} units and notified contacts`
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
                        <span className="text-white">{typeof insulinCalcResult.totalInsulin === 'number' ? insulinCalcResult.totalInsulin.toFixed(1) : insulinCalcResult.totalInsulin} units</span>
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
