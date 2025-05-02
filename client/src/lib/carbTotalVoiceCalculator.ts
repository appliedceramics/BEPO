/**
 * Simple, dedicated function for voice-based carb total calculations.
 * This handles the specific use case of saying "15 plus 20 plus 10 carb total"
 * and having it immediately calculate and set the carb value.
 */

/**
 * Processes a voice transcript specifically for carb total calculations
 */
export function processCarbTotalVoice(transcript: string): { 
  success: boolean;
  total?: number;
  numbers?: number[];
  message?: string; 
} {
  // Convert to lowercase for consistent processing
  const text = transcript.toLowerCase();
  
  console.log("CARB TOTAL PROCESSOR: Processing text:", text);
  
  // Extract all numbers from the text
  const numberMatches = text.match(/\d+\.?\d*/g);
  if (!numberMatches || numberMatches.length < 2) {
    return { 
      success: false, 
      message: "Need at least 2 numbers for carb total calculation" 
    };
  }
  
  // Convert string matches to numbers
  const numbers = numberMatches.map(match => parseFloat(match));
  
  // Check for addition operators
  const additionIndicators = ['plus', '+', 'and', 'then', 'with'];
  const hasAddition = additionIndicators.some(word => text.includes(word));
  
  // Check for carb total indicators
  const carbTotalIndicators = [
    'carb total', 'carbs total', 'total carbs', 'total', 
    'that is', 'that\'s', 'equals', 'equal', '='
  ];
  const hasCarbTotal = carbTotalIndicators.some(word => text.includes(word));
  
  console.log("CARB TOTAL PROCESSOR: Analysis", { 
    numbers, hasAddition, hasCarbTotal, additionWords: additionIndicators.filter(w => text.includes(w)),
    totalWords: carbTotalIndicators.filter(w => text.includes(w))
  });
  
  // Calculate the total
  const total = numbers.reduce((sum, num) => sum + num, 0);
  
  // If we have both numbers and either a) addition operators or b) a total indicator, consider it successful
  if (hasAddition || hasCarbTotal) {
    console.log("CARB TOTAL PROCESSOR: Success!", { total, numbers });
    return { 
      success: true, 
      total, 
      numbers,
      message: `Calculated ${numbers.join(' + ')} = ${total}`
    };
  }
  
  // If we have multiple numbers but no operators or total indicators
  return { 
    success: false, 
    message: "Multiple numbers found but no '+' or 'total' indicator" 
  };
}
