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
          1️⃣ Say numbers with "plus" between them:
        </div>
        <div className="text-sm bg-gray-700/60 px-2 py-1 rounded my-1">
          Example: <span className="text-amber-300">15</span> plus <span className="text-amber-300">20</span> plus <span className="text-amber-300">10</span>
        </div>
        <div className="text-xs mt-2">
          2️⃣ When finished, say <span className="bg-amber-700/60 px-1 rounded font-bold">"Carb Total"</span> to calculate
        </div>
        <div className="text-xs mt-1 text-gray-400 italic">
          (Other phrases that work: "total carbs", "carbs total", "total")
        </div>
        <div className="text-xs mt-2 text-green-300">
          ✓ Your numbers will be automatically added: 15 + 20 + 10 = 45
        </div>
      </>
    );
  } else if (type === 'bg') {
    content = (
      <>
        <div className="font-bold text-blue-300 mb-1">Blood Glucose Voice Input:</div>
        <div className="text-sm">
          Simply say your BG reading as a number:
        </div>
        <div className="text-sm bg-gray-700/60 px-2 py-1 rounded my-1">
          Examples: <span className="text-blue-300">"5.6"</span> or <span className="text-blue-300">"123"</span>
        </div>
        <div className="text-xs mt-1 text-gray-300">
          The voice recognition will automatically detect when you finish speaking
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
