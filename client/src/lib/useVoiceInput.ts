import { useState, useEffect, useCallback } from 'react';
import { generateStartListeningSound, generateStopListeningSound, generateConfirmSound } from './generateAudioFeedback';

// Define the interface for our hook return values
interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
}

// Define numeric keywords that we want to recognize
const numericKeywords: Record<string, string> = {
  'zero': '0',
  'one': '1',
  'two': '2',
  'three': '3',
  'four': '4',
  'five': '5',
  'six': '6',
  'seven': '7',
  'eight': '8',
  'nine': '9',
  'point': '.',
  'decimal': '.'
};

// Define operation keywords
const operationKeywords: Record<string, string> = {
  'plus': '+',
  'add': '+',
  'minus': '-',
  'subtract': '-',
  'times': '*',
  'multiply': '*',
  'divided by': '/',
  'divide': '/',
  'equals': '=',
  'equal': '='
};

// Define function commands
const commandKeywords: Record<string, string> = {
  'clear': 'clear',
  'reset': 'clear',
  'breakfast': 'first',
  'lunch': 'other',
  'dinner': 'other',
  'bedtime': 'bedtime',
  'long acting': 'longActing',
  'basal': 'longActing',
  'carb total': 'carbTotal',
  'carbs total': 'carbTotal',
  'carbohydrate total': 'carbTotal',
  'total carbs': 'carbTotal',
  'total': 'carbTotal'
};

// We'll use the Web Audio API for generating sounds in the application
// The sounds are implemented in generateAudioFeedback.ts

/**
 * Custom hook for voice input with Web Speech API
 */
export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);

  // Process the transcript to extract numbers and operations
  const processTranscript = useCallback((text: string): string => {
    // Convert to lowercase for easier matching
    let processedText = text.toLowerCase();
    
    // Replace numeric keywords with actual numbers
    Object.entries(numericKeywords).forEach(([keyword, value]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      processedText = processedText.replace(regex, value);
    });
    
    // Replace operation keywords
    Object.entries(operationKeywords).forEach(([keyword, value]) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      processedText = processedText.replace(regex, value);
    });

    return processedText;
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      // Set up event handlers
      recognitionInstance.onstart = () => {
        setIsListening(true);
        generateStartListeningSound(); // Play whisper-soft start sound
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        generateStopListeningSound(); // Play whisper-soft stop sound
      };
      
      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscriptValue = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptValue += transcript + ' ';
            // Play whisper-soft confirmation sound for final results
            generateConfirmSound();
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Process and set the transcripts
        const processedInterim = processTranscript(interimTranscript);
        setTranscript(processedInterim);
        
        if (finalTranscriptValue) {
          const processedFinal = processTranscript(finalTranscriptValue);
          setFinalTranscript(prevFinal => prevFinal + processedFinal);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
      setHasRecognitionSupport(true);
    } else {
      setHasRecognitionSupport(false);
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [processTranscript]);

  // Start listening function
  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [recognition, isListening]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  };
}

// Helper function to extract command from transcript
export function extractCommand(transcript: string): string | null {
  const text = transcript.toLowerCase();
  
  for (const [keyword, command] of Object.entries(commandKeywords)) {
    if (text.includes(keyword)) {
      return command;
    }
  }
  
  return null;
}

// Helper function to extract numbers from transcript
export function extractNumber(transcript: string): number | null {
  // Remove all non-numeric characters except decimal point
  const numberPattern = /\d+\.?\d*/g;
  const matches = transcript.match(numberPattern);
  
  if (matches && matches.length > 0) {
    // Get the last match
    return parseFloat(matches[matches.length - 1]);
  }
  
  return null;
}

// Helper function to calculate the sum of a series of numbers separated by 'plus'
export function calculateCarbTotal(transcript: string): number | null {
  // Convert to lowercase and ensure consistent spacing
  const text = transcript.toLowerCase();
  
  // Check if the text includes any carb total command
  const carbTotalCommands = ['carb total', 'carbs total', 'total carbs', 'total', 'carbohydrate total'];
  const hasCarbTotal = carbTotalCommands.some(cmd => text.includes(cmd));
  
  if (!hasCarbTotal) {
    console.log("No carb total command found in:", text);
    return null;
  }
  
  console.log("Processing carb total for:", text);
  
  // Extract all numbers from the full transcript
  const allNumberMatches = text.match(/\d+\.?\d*/g);
  if (allNumberMatches && allNumberMatches.length > 0) {
    // Check if we have "plus" in the text
    const hasPlusOperator = text.includes('plus') || text.includes('+');
    
    if (hasPlusOperator) {
      console.log("Found numbers with plus operator:", allNumberMatches);
      // Sum all numbers if plus is in the text
      let total = 0;
      allNumberMatches.forEach(match => {
        total += parseFloat(match);
      });
      console.log("Calculated sum:", total);
      return total;
    } else {
      // If there's no "plus", return the last number which is likely the most recent
      const lastNumber = parseFloat(allNumberMatches[allNumberMatches.length - 1]);
      console.log("No plus found, using last number:", lastNumber);
      return lastNumber;
    }
  }
  
  console.log("No numbers found in voice input");
  return null;
}

// Helper function to extract operation from transcript
export function extractOperation(transcript: string): string | null {
  const text = transcript.toLowerCase();
  
  for (const [keyword, operation] of Object.entries(operationKeywords)) {
    if (text.includes(keyword)) {
      return operation;
    }
  }
  
  return null;
}
