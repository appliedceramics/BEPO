import React, { useEffect, useState, useRef } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 50,
  onComplete,
  className = ""
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    let currentIndex = 0;
    setDisplayedText("");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start the typing effect
    timerRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => prev + text.charAt(currentIndex));
        currentIndex++;
      } else {
        // Clear interval once complete
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Call completion callback if provided
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);
    
    // Cleanup on unmount or when text changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [text, speed, onComplete]);
  
  return (
    <div className={`digital-display ${className}`}>
      {displayedText}<span className="animate-pulse text-green-400">|</span>
    </div>
  );
};
