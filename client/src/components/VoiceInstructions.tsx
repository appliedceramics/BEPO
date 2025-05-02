import React from 'react';
import { motion } from 'framer-motion';

interface VoiceInstructionsProps {
  isVisible: boolean;
  type: 'carb-total' | 'bg' | 'general';
}

export const VoiceInstructions: React.FC<VoiceInstructionsProps> = ({ isVisible, type }) => {
  if (!isVisible) return null;
  
  let content = (
    <>
      <span className="font-bold">Voice Command:</span> Say numbers and operations
    </>
  );
  
  if (type === 'carb-total') {
    content = (
      <>
        <div className="font-bold text-amber-300 mb-1">Voice Carb Counting:</div>
        <div className="text-sm">
          Say: <span className="bg-gray-700 px-1 rounded">number</span> +
          <span className="bg-gray-700 px-1 rounded">number</span> +
          <span className="bg-gray-700 px-1 rounded">number</span>
        </div>
        <div className="text-xs mt-1">
          Finish by saying: <span className="bg-amber-800/60 px-1 rounded">Carb Total</span> or press the button
        </div>
      </>
    );
  } else if (type === 'bg') {
    content = (
      <>
        <div className="font-bold text-blue-300 mb-1">Blood Glucose Voice Input:</div>
        <div className="text-sm">
          Say your current BG reading (e.g., <span className="bg-gray-700 px-1 rounded">"5.6"</span> or
          <span className="bg-gray-700 px-1 rounded">"one two three"</span>)
        </div>
      </>
    );
  }
  
  return (
    <motion.div
      className="bg-gray-800/90 text-white p-2 rounded-md shadow-md text-xs max-w-xs border border-gray-600 mb-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {content}
    </motion.div>
  );
};

export default VoiceInstructions;
