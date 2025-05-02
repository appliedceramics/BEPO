import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { convertBgToMgdl } from "@/lib/correctionCalculator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { calculateInsulin, CalculationResult } from "@/lib/insulinCalculator";
import { Loader2 } from "lucide-react";
import { MealType, Profile } from "@shared/schema";

export default function FunCalculatorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayValue, setDisplayValue] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  
  // Blood glucose and carb inputs for insulin calculation
  const [bgValue, setBgValue] = useState<number | null>(null);
  const [carbValue, setCarbValue] = useState<number | null>(null);
  const [mealType, setMealType] = useState<MealType | "">("");

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
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === "0" ? digit : displayValue + digit);
    }
  };

  // Handle decimal point
  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplayValue("0.");
      setWaitingForSecondOperand(false);
      return;
    }

    if (!displayValue.includes(".")) {
      setDisplayValue(displayValue + ".");
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
    const inputValue = parseFloat(displayValue);

    if (previousValue !== null && operation) {
      const result = performCalculation(operation, previousValue, inputValue);
      setDisplayValue(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForSecondOperand(false);
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

  // Button components
  const NumberButton = ({ digit }: { digit: string }) => (
    <button 
      className="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold rounded-full h-16 w-16 flex items-center justify-center shadow-md" 
      onClick={() => inputDigit(digit)}
    >
      {digit}
    </button>
  );

  const OperatorButton = ({ operator, label }: { operator: string, label: string }) => (
    <button 
      className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-full h-16 w-16 flex items-center justify-center shadow-md" 
      onClick={() => handleOperator(operator)}
    >
      {label}
    </button>
  );

  const DecimalButton = () => (
    <button 
      className="bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold rounded-full h-16 w-16 flex items-center justify-center shadow-md" 
      onClick={inputDecimal}
    >
      .
    </button>
  );

  const EqualsButton = () => (
    <button 
      className="bg-purple-500 hover:bg-purple-600 text-white text-2xl font-bold rounded-full h-16 w-16 flex items-center justify-center shadow-md" 
      onClick={handleEquals}
    >
      =
    </button>
  );

  const ClearButton = () => (
    <button 
      className="bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded-xl h-16 w-full flex items-center justify-center shadow-md" 
      onClick={clearCalculator}
    >
      CLEAR ENTRY
    </button>
  );

  // Meal type selection buttons
  const MealTypeButton = ({ type, label }: { type: MealType, label: string }) => (
    <button 
      className={`${mealType === type ? 'bg-blue-600' : 'bg-blue-400'} hover:bg-blue-500 text-white text-md font-bold rounded-xl p-2 flex-1 flex items-center justify-center shadow-md`} 
      onClick={() => setMealType(type)}
    >
      {label}
    </button>
  );

  // Input setter buttons
  const InputSetterButton = ({ action, label }: { action: () => void, label: string }) => (
    <button 
      className="bg-teal-500 hover:bg-teal-600 text-white text-md font-bold rounded-xl p-2 flex-1 flex items-center justify-center shadow-md"
      onClick={action}
    >
      {label}
    </button>
  );

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
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Calculator header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-center">
            <h1 className="text-3xl font-bold text-white">BEPO Fun Calculator</h1>
          </div>
          
          {/* Display area with previous answer */}
          <div className="p-4 bg-gray-100">
            <div className="text-right text-gray-500 mb-1">
              Previous Answer: {previousValue !== null ? previousValue : "0"}
            </div>
            <div className="bg-white border-2 border-gray-300 rounded-xl p-4 text-right text-5xl font-bold">
              {displayValue}
            </div>
          </div>
          
          <div className="p-4 flex flex-row gap-4">
            {/* Main calculator area */}
            <div className="flex flex-col gap-4 flex-1">
              {/* Clear button */}
              <ClearButton />
              
              {/* Number pad */}
              <div className="bg-blue-100 p-4 rounded-xl grid grid-cols-4 gap-4">
                <NumberButton digit="7" />
                <NumberButton digit="8" />
                <NumberButton digit="9" />
                <OperatorButton operator="/" label="÷" />
                
                <NumberButton digit="4" />
                <NumberButton digit="5" />
                <NumberButton digit="6" />
                <OperatorButton operator="*" label="×" />
                
                <NumberButton digit="1" />
                <NumberButton digit="2" />
                <NumberButton digit="3" />
                <OperatorButton operator="-" label="-" />
                
                <NumberButton digit="0" />
                <DecimalButton />
                <EqualsButton />
                <OperatorButton operator="+" label="+" />
              </div>
              
              {/* Insulin calculator section */}
              <div className="bg-yellow-100 p-4 rounded-xl">
                <h2 className="text-xl font-bold text-center mb-2">Insulin Calculator</h2>
                
                {/* Meal type selection */}
                <div className="flex gap-2 mb-3">
                  <button 
                    className={`${mealType === "first" ? 'bg-blue-600' : 'bg-blue-400'} hover:bg-blue-500 text-white text-md font-bold rounded-xl p-2 flex-1 flex items-center justify-center shadow-md`}
                    onClick={() => setMealType("first" as MealType)}
                  >
                    Breakfast
                  </button>
                  <button 
                    className={`${mealType === "other" ? 'bg-blue-600' : 'bg-blue-400'} hover:bg-blue-500 text-white text-md font-bold rounded-xl p-2 flex-1 flex items-center justify-center shadow-md`}
                    onClick={() => setMealType("other" as MealType)}
                  >
                    Other Meal
                  </button>
                  <button 
                    className={`${mealType === "bedtime" ? 'bg-blue-600' : 'bg-blue-400'} hover:bg-blue-500 text-white text-md font-bold rounded-xl p-2 flex-1 flex items-center justify-center shadow-md`}
                    onClick={() => setMealType("bedtime" as MealType)}
                  >
                    Bedtime
                  </button>
                </div>
                
                {/* Input setter buttons */}
                <div className="flex gap-2 mb-3">
                  <InputSetterButton action={setAsBloodGlucose} label={`Set BG (${profile?.bgUnit || 'mmol/L'})`} />
                  <InputSetterButton action={setAsCarbs} label="Set Carbs (g)" />
                </div>
                
                {/* Insulin calculation results */}
                {mealType && bgValue ? (
                  <div className="bg-white p-3 rounded-lg shadow-inner">
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
                      
                      <div className="font-bold text-primary">Total Insulin:</div>
                      <div className="text-primary font-bold">{insulinCalcResult.totalInsulin.toFixed(1)} units</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 italic">
                    Select meal type and enter blood glucose to calculate insulin
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
