import React, { useEffect, useState } from 'react';
import { useVoiceInput, extractNumber, extractOperation, extractCommand } from '@/lib/useVoiceInput';
import { generateConfirmSound, generateStartListeningSound, generateStopListeningSound } from '@/lib/generateAudioFeedback';
import { processCarbTotalVoice } from '@/lib/carbTotalVoiceCalculator';
import { MicIcon, StopCircleIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  onNumberInput: (value: string) => void;
  onOperationInput: (operation: string) => void;
  onCommandInput: (command: string) => void;
  enabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onNumberInput,
  onOperationInput,
  onCommandInput,
  enabled = true
}) => {
  const { 
    isListening, 
    transcript, 
    finalTranscript, 
    startListening, 
    stopListening, 
    resetTranscript,
    hasRecognitionSupport 
  } = useVoiceInput();
  
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Process new transcripts to extract commands, numbers, etc.
  useEffect(() => {
    if (!enabled || !hasRecognitionSupport) return;
    
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      // Process the new part of the transcript
      const newText = finalTranscript.slice(lastProcessedTranscript.length).trim();
      if (newText) {
        console.log("New voice input detected:", newText);
        setFeedback(`Heard: ${newText}`);
        
        // Try the specialized carb total handler first - this is the simplest path to handle
        // the specific "15 plus 20 plus 10 carb total" use case
        const carbTotalResult = processCarbTotalVoice(newText);
        if (carbTotalResult.success) {
          console.log("✓✓✓ CARB TOTAL PROCESSOR SUCCESS!", carbTotalResult);
          // Apply the calculated total as the result
          onNumberInput(carbTotalResult.total!.toString());
          
          // Play success sound
          generateConfirmSound();
          
          // Send the command to complete the carb total operation
          setTimeout(() => {
            console.log("Auto-completing with carbTotal command");
            onCommandInput('carbTotal');
          }, 300);
          
          // Show feedback with calculation details
          if (carbTotalResult.message) {
            setFeedback(carbTotalResult.message);
          }
          
          // Set the processed transcript and exit early
          setLastProcessedTranscript(finalTranscript);
          return;
        }
        
        // If specialized handler didn't match, fall back to original processing
        const lowerText = newText.toLowerCase();
        const carbTotalCommands = ['carb total', 'carbs total', 'carbohydrate total', 'total carbs', 'total'];
        const hasCarbTotal = carbTotalCommands.some(cmd => lowerText.includes(cmd));
        const additionOperators = ['plus', '+', 'and', 'then', 'with', 'sum', 'add'];
        const hasAddition = additionOperators.some(op => lowerText.includes(op));
        const numberMatches = lowerText.match(/\d+(\.\d+)?/g);
        
        console.log("Voice input analysis (fallback):", {
          text: lowerText,
          hasCarbTotal,
          hasAddition,
          numberMatches
        });
        
        // Normal carb total command
        if (hasCarbTotal) {
          console.log("✓ Detected carb total command in:", lowerText);
          // Generate confirmation sound
          generateConfirmSound();
          onCommandInput('carbTotal');
          setFeedback(`Command: Carb Total`);
        } 
        // Check for number sequences separated by "plus" without carb total
        else if (hasAddition) {
          console.log("Processing voice input with plus:", lowerText);
          
          if (numberMatches && numberMatches.length > 1) {
            // Convert matches to numbers
            const numbers = numberMatches.map(match => parseFloat(match));
            
            // Calculate the sum
            const sum = numbers.reduce((total, num) => total + num, 0);
            console.log("Extracted numbers:", numbers, "Sum:", sum);
            
            // Clear previous calculation
            onCommandInput('clear');
            
            // Send each number and plus operation to build the calculation
            numbers.forEach((num, index) => {
              if (index === 0) {
                // First number
                onNumberInput(num.toString());
              } else {
                // For subsequent numbers, send a plus operation then the number
                onOperationInput('+');
                onNumberInput(num.toString());
              }
            });
            
            // Generate confirmation sound
            generateConfirmSound();
            setFeedback(`Added: ${numbers.join(' + ')}`);
          } else {
            console.log("Could not extract multiple numbers from voice input");
          }
        } else {
          // Check for other commands
          const command = extractCommand(newText);
          if (command) {
            // Generate soft confirmation sound
            generateConfirmSound();
            onCommandInput(command);
            setFeedback(`Command: ${command}`);
          } else {
            // Check for numbers
            const number = extractNumber(newText);
            if (number !== null) {
              // Generate soft confirmation sound
              generateConfirmSound();
              onNumberInput(number.toString());
              setFeedback(`Number: ${number}`);
            }
            
            // Check for operations
            const operation = extractOperation(newText);
            if (operation) {
              // Generate soft confirmation sound
              generateConfirmSound();
              onOperationInput(operation);
              setFeedback(`Operation: ${operation}`);
            }
          }
        }
      }
      
      setLastProcessedTranscript(finalTranscript);
    }
  }, [finalTranscript, lastProcessedTranscript, onNumberInput, onOperationInput, onCommandInput, enabled, hasRecognitionSupport]);
  
  // Generate sound when listening starts/stops
  useEffect(() => {
    if (isListening) {
      generateStartListeningSound();
    } else if (lastProcessedTranscript) {
      generateStopListeningSound();
    }
  }, [isListening, lastProcessedTranscript]);
  
  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timeoutId = setTimeout(() => setFeedback(''), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [feedback]);
  
  // Handle button click to toggle listening
  const handleToggleListening = () => {
    if (!hasRecognitionSupport) {
      // Use standard Web Audio API instead of playErrorSound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(330, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
      
      setFeedback('Voice recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setLastProcessedTranscript('');
      startListening();
    }
  };
  
  if (!enabled) return null;
  
  return (
    <div className="relative">
      <motion.button
        className={`rounded-full p-3 shadow-md flex items-center justify-center transition-colors ${isListening 
          ? 'bg-pink-600 text-white animate-pulse' 
          : 'bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white'}`}
        onClick={handleToggleListening}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isListening ? 'Stop listening' : 'Start voice input'}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        disabled={!hasRecognitionSupport}
      >
        {isListening ? (
          <StopCircleIcon className="w-5 h-5" />
        ) : (
          <MicIcon className="w-5 h-5" />
        )}
      </motion.button>
      
      {/* Live transcript indicator */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div 
            className="absolute top-full mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md z-10 min-w-[100px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Feedback message */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            className="absolute bottom-full mb-2 bg-blue-700/70 text-white text-xs px-2 py-1 rounded shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.9, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;